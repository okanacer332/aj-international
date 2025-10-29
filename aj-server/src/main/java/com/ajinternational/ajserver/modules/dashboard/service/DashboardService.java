package com.ajinternational.ajserver.modules.dashboard.service;

// --- YENİ IMPORTLAR ---
import com.ajinternational.ajserver.config.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
// --- YENİ IMPORTLAR SONU ---
import com.ajinternational.ajserver.modules.audit.model.AuditLog;
// --- DEĞİŞİKLİK: AuditLogService importu yerine direkt repository kullanıyoruz ---
// import com.ajinternational.ajserver.modules.audit.service.AuditLogService; // Bu kaldırıldı
import com.ajinternational.ajserver.modules.audit.repository.AuditLogRepository; // Repository importu zaten var
// --- DEĞİŞİKLİK SONU ---
import com.ajinternational.ajserver.modules.dashboard.dto.*;
import com.ajinternational.ajserver.modules.hr.knowledge.model.UserProductKnowledge;
import com.ajinternational.ajserver.modules.hr.knowledge.repository.UserProductKnowledgeRepository;
import com.ajinternational.ajserver.modules.iam.model.User;
import com.ajinternational.ajserver.modules.iam.repository.UserRepository;
import com.ajinternational.ajserver.modules.masterdata.model.MasterProduct;
import com.ajinternational.ajserver.modules.masterdata.repository.MasterProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    // --- Logger eklendi ---
    private static final Logger logger = LoggerFactory.getLogger(DashboardService.class);
    // --- Logger eklendi sonu ---

    private final UserRepository userRepository;
    private final MasterProductRepository masterProductRepository;
    private final UserProductKnowledgeRepository knowledgeRepository;
    private final AuditLogRepository auditLogRepository; // AuditLogService yerine direkt repository

    // --- MOCK_TENANT_ID KALDIRILDI ---
    // private static final String MOCK_TENANT_ID = "TR";
    // --- MOCK_TENANT_ID KALDIRILDI SONU ---

    // --- Yardımcı metot eklendi ---
    private String getCurrentTenantId() {
        String tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null) {
            logger.error("Dashboard özeti oluşturulurken geçerli Tenant ID bulunamadı!");
            throw new IllegalStateException("Tenant ID context'te bulunamadı.");
        }
        return tenantId;
    }
    // --- Yardımcı metot sonu ---

    public DashboardSummaryDto getDashboardSummary() {
        String currentTenantId = getCurrentTenantId();
        logger.info("Tenant '{}' için dashboard özeti oluşturuluyor...", currentTenantId);

        // --- Veri Çekme (Tenant Bazlı) ---
        List<User> tenantUsers = userRepository.findByTenantId(currentTenantId); // findAll() yerine
        List<MasterProduct> tenantMasterProducts = masterProductRepository.findByTenantIdAndParentProductIdIsNull(currentTenantId); // MOCK_TENANT_ID yerine
        List<UserProductKnowledge> tenantKnowledge = knowledgeRepository.findAllByTenantId(currentTenantId); // findAll() yerine
        List<AuditLog> tenantRecentActivities = auditLogRepository.findTop5ByTenantIdOrderByTimestampDesc(currentTenantId); // Tenant bazlı metot

        logger.debug("Tenant verileri çekildi: Users={}, MasterProducts={}, Knowledge={}, Activities={}",
                tenantUsers.size(), tenantMasterProducts.size(), tenantKnowledge.size(), tenantRecentActivities.size());

        // --- KPI Hesaplamaları (Tenant Bazlı Veri Kullanılıyor) ---
        long totalEmployees = tenantUsers.size();
        long totalMasterProducts = tenantMasterProducts.size();

        // Ortalama yetkinlik skoru (sadece bu tenant'taki knowledge kayıtları üzerinden)
        double averageCompetencyScore = tenantKnowledge.isEmpty() ? 0 : tenantKnowledge.stream()
                .mapToInt(UserProductKnowledge::getScore)
                .average()
                .orElse(0);

        // Yetkinlik tamamlama oranı (sadece bu tenant'taki kullanıcılar ve knowledge kayıtları üzerinden)
        Set<String> usersWhoVotedInTenant = tenantKnowledge.stream()
                .map(UserProductKnowledge::getUserId)
                .collect(Collectors.toSet());
        // Sadece bu tenant'taki kullanıcıların ID'lerini al
        Set<String> tenantUserIds = tenantUsers.stream().map(User::getId).collect(Collectors.toSet());
        // Tenant'taki oy veren kullanıcı sayısını bul
        long distinctUsersWhoVoted = usersWhoVotedInTenant.stream().filter(tenantUserIds::contains).count();

        double competencyCompletionRate = totalEmployees > 0 ? ((double) distinctUsersWhoVoted / totalEmployees) * 100 : 0;

        logger.debug("KPI'lar hesaplandı: totalEmployees={}, totalMasterProducts={}, avgScore={}, completionRate={}%",
                totalEmployees, totalMasterProducts, String.format("%.1f", averageCompetencyScore), String.format("%.1f", competencyCompletionRate));

        // --- Grafik ve Liste Verileri (Tenant Bazlı Veri Kullanılıyor) ---
        Map<String, MasterProduct> productMap = tenantMasterProducts.stream()
                .collect(Collectors.toMap(MasterProduct::getId, Function.identity()));

        // Ürün bazında yetkinlik ortalamaları (sadece bu tenant'taki knowledge kayıtları)
        Map<String, Double> averageScoreByProduct = tenantKnowledge.stream()
                .collect(Collectors.groupingBy(UserProductKnowledge::getProductId, Collectors.averagingInt(UserProductKnowledge::getScore)));

        List<CompetencyByProductDto> competencyByProduct = averageScoreByProduct.entrySet().stream()
                .filter(entry -> productMap.containsKey(entry.getKey())) // Sadece bu tenant'taki ana ürünleri dahil et
                .map(entry -> {
                    MasterProduct product = productMap.get(entry.getKey());
                    // Ürün bulunamazsa logla (alt ürün yetkinliği olabilir, şimdilik atlıyoruz)
                    if (product == null) {
                        logger.warn("Yetkinlik hesaplamasında MasterProduct bulunamadı: ProductId={}", entry.getKey());
                        return null;
                    }
                    return new CompetencyByProductDto(product.getName(), entry.getKey(), entry.getValue());
                })
                .filter(Objects::nonNull) // Bulunamayan ürünleri filtrele
                .sorted(Comparator.comparing(CompetencyByProductDto::getAverageScore).reversed())
                .collect(Collectors.toList());

        // Kullanıcı bazında yetkinlik ortalamaları (sadece bu tenant'taki knowledge kayıtları)
        Map<String, Double> averageScoreByUser = tenantKnowledge.stream()
                .collect(Collectors.groupingBy(UserProductKnowledge::getUserId, Collectors.averagingInt(UserProductKnowledge::getScore)));

        // Yetkinlik seviye dağılımı (sadece bu tenant'taki kullanıcıların ortalamaları)
        Map<String, Long> userCountByLevel = averageScoreByUser.entrySet().stream()
                .filter(entry -> tenantUserIds.contains(entry.getKey())) // Sadece bu tenant'taki kullanıcıları dahil et
                .map(Map.Entry::getValue) // Sadece skorları al
                .map(this::getCompetencyLevelName)
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));

        List<CompetencyLevelDistributionDto> competencyLevelDistribution = userCountByLevel.entrySet().stream()
                .map(entry -> new CompetencyLevelDistributionDto(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparing(dto -> getLevelOrder(dto.getLevelName())))
                .collect(Collectors.toList());

        Map<String, User> userMap = tenantUsers.stream() // allUsers yerine tenantUsers kullan
                .collect(Collectors.toMap(User::getId, Function.identity()));

        // En yetkin kullanıcılar (sadece bu tenant'taki kullanıcılar arasından)
        List<TopUserDto> topCompetentUsers = averageScoreByUser.entrySet().stream()
                .filter(entry -> userMap.containsKey(entry.getKey())) // Sadece bu tenant'taki kullanıcıları dahil et
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(5)
                .map(entry -> {
                    User user = userMap.get(entry.getKey()); // userMap zaten tenant bazlı
                    // user null olmamalı ama yine de kontrol edelim
                    if (user == null) return null;
                    return new TopUserDto(user.getFullName(), user.getAvatarUrl(), entry.getValue());
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        // Geliştirilmesi gereken ürünler (sadece bu tenant'taki ürünler ve skorlar baz alınarak)
        List<CompetencyByProductDto> productsToImprove = competencyByProduct.stream() // tenant bazlı competencyByProduct listesini kullan
                .sorted(Comparator.comparing(CompetencyByProductDto::getAverageScore))
                .limit(3)
                .collect(Collectors.toList());

        // Son aktiviteler zaten tenant bazlı çekildi (tenantRecentActivities)

        logger.info("Tenant '{}' için dashboard özeti başarıyla oluşturuldu.", currentTenantId);
        return DashboardSummaryDto.builder()
                .totalEmployees(totalEmployees)
                .totalMasterProducts(totalMasterProducts)
                .averageCompetencyScore(averageCompetencyScore)
                .competencyCompletionRate(competencyCompletionRate)
                .competencyByProduct(competencyByProduct)
                .competencyLevelDistribution(competencyLevelDistribution)
                .topCompetentUsers(topCompetentUsers)
                .productsToImprove(productsToImprove)
                .recentActivities(tenantRecentActivities) // tenantRecentActivities kullanıldı
                .build();
    }

    // Yetkinlik seviyesi adını döndüren yardımcı metot (Aynı kalabilir)
    private String getCompetencyLevelName(double score) {
        if (score >= 9) return "Uzman";
        if (score >= 7) return "Deneyimli";
        if (score >= 5) return "Orta Düzey";
        return "Acemi";
    }

    // Seviyeleri sıralamak için yardımcı metot (Aynı kalabilir)
    private int getLevelOrder(String levelName) {
        return switch (levelName) {
            case "Uzman" -> 4;
            case "Deneyimli" -> 3;
            case "Orta Düzey" -> 2;
            case "Acemi" -> 1;
            default -> 0;
        };
    }
}