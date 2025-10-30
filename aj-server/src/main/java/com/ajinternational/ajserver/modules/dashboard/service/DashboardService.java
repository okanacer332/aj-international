package com.ajinternational.ajserver.modules.dashboard.service;

import com.ajinternational.ajserver.config.TenantContextHolder; // Eklendi
import com.ajinternational.ajserver.modules.audit.model.AuditLog;
// GÜNCELLENDİ: AuditLogRepository yerine AuditLogService kullanılacak
import com.ajinternational.ajserver.modules.audit.service.AuditLogService;
import com.ajinternational.ajserver.modules.dashboard.dto.*;
import com.ajinternational.ajserver.modules.hr.knowledge.model.UserProductKnowledge;
import com.ajinternational.ajserver.modules.hr.knowledge.repository.UserProductKnowledgeRepository;
import com.ajinternational.ajserver.modules.iam.model.User;
import com.ajinternational.ajserver.modules.iam.repository.UserRepository;
import com.ajinternational.ajserver.modules.masterdata.model.MasterProduct;
import com.ajinternational.ajserver.modules.masterdata.repository.MasterProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails; // Eklendi
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final MasterProductRepository masterProductRepository;
    private final UserProductKnowledgeRepository knowledgeRepository;
    private final AuditLogService auditLogService; // GÜNCELLENDİ: Repository yerine Service

    // MOCK_TENANT_ID kaldırıldı

    public DashboardSummaryDto getDashboardSummary() {

        // GÜNCELLENDİ: O anki kullanıcının rolü ve tenant'ı alınır
        UserDetails userDetails = TenantContextHolder.getCurrentUserDetails();
        String tenantId = TenantContextHolder.getCurrentTenantId();
        boolean isSuperAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        // --- Veri Çekme (Tenant'a Göre) ---
        List<User> allUsers;
        List<MasterProduct> allMasterProducts;
        List<UserProductKnowledge> allKnowledge;
        List<AuditLog> recentActivities;

        if (isSuperAdmin) {
            // Süper Admin tüm tenant'lardaki verileri çeker
            allUsers = userRepository.findAll();
            // Süper Admin tüm ana ürünleri (tenant fark etmeksizin) çeker
            allMasterProducts = masterProductRepository.findAll().stream()
                    .filter(p -> p.getParentProductId().isEmpty())
                    .collect(Collectors.toList());
            allKnowledge = knowledgeRepository.findAll();
            recentActivities = auditLogService.getRecentActivities(); // Bu metot zaten Süper Admin için global getirir
        } else {
            // Normal Admin/Kullanıcı sadece kendi tenant'ındaki verileri çeker
            allUsers = userRepository.findByTenantId(tenantId);
            allMasterProducts = masterProductRepository.findByTenantIdAndParentProductIdIsNull(tenantId);
            allKnowledge = knowledgeRepository.findByTenantId(tenantId); // Yeni eklenen metot kullanıldı
            recentActivities = auditLogService.getRecentActivities(); // Bu metot normal admin için tenant'a göre getirir
        }

        // --- KPI Hesaplamaları ---
        // (Bu bloktaki kod, yukarıda çekilen listelere bağımlı olduğu için DEĞİŞMEDİ)
        long totalEmployees = allUsers.size();
        long totalMasterProducts = allMasterProducts.size();
        double averageCompetencyScore = allKnowledge.isEmpty() ? 0 : allKnowledge.stream().mapToInt(UserProductKnowledge::getScore).average().orElse(0);
        long distinctUsersWhoVoted = allKnowledge.stream().map(UserProductKnowledge::getUserId).distinct().count();
        double competencyCompletionRate = totalEmployees > 0 ? ((double) distinctUsersWhoVoted / totalEmployees) * 100 : 0;

        // --- Grafik ve Liste Verileri ---
        // (Bu bloktaki kod, yukarıda çekilen listelere bağımlı olduğu için DEĞİŞMEDİ)
        Map<String, MasterProduct> productMap = allMasterProducts.stream().collect(Collectors.toMap(MasterProduct::getId, Function.identity()));
        Map<String, Double> averageScoreByProduct = allKnowledge.stream()
                .collect(Collectors.groupingBy(UserProductKnowledge::getProductId, Collectors.averagingInt(UserProductKnowledge::getScore)));
        List<CompetencyByProductDto> competencyByProduct = averageScoreByProduct.entrySet().stream()
                .filter(entry -> productMap.containsKey(entry.getKey()))
                .map(entry -> new CompetencyByProductDto(productMap.get(entry.getKey()).getName(), entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparing(CompetencyByProductDto::getAverageScore).reversed())
                .collect(Collectors.toList());
        Map<String, Double> averageScoreByUser = allKnowledge.stream()
                .collect(Collectors.groupingBy(UserProductKnowledge::getUserId, Collectors.averagingInt(UserProductKnowledge::getScore)));
        Map<String, Long> userCountByLevel = averageScoreByUser.values().stream()
                .map(this::getCompetencyLevelName)
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
        List<CompetencyLevelDistributionDto> competencyLevelDistribution = userCountByLevel.entrySet().stream()
                .map(entry -> new CompetencyLevelDistributionDto(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparing(dto -> getLevelOrder(dto.getLevelName())))
                .collect(Collectors.toList());
        Map<String, User> userMap = allUsers.stream().collect(Collectors.toMap(User::getId, Function.identity()));
        List<TopUserDto> topCompetentUsers = averageScoreByUser.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(5)
                .map(entry -> {
                    User user = userMap.get(entry.getKey());
                    if (user == null) return null;
                    return new TopUserDto(user.getFullName(), user.getAvatarUrl(), entry.getValue());
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        List<CompetencyByProductDto> productsToImprove = competencyByProduct.stream()
                .sorted(Comparator.comparing(CompetencyByProductDto::getAverageScore))
                .limit(3)
                .collect(Collectors.toList());

        // --- DTO Oluşturma ---
        // (Bu blok DEĞİŞMEDİ)
        return DashboardSummaryDto.builder()
                .totalEmployees(totalEmployees)
                .totalMasterProducts(totalMasterProducts)
                .averageCompetencyScore(averageCompetencyScore)
                .competencyCompletionRate(competencyCompletionRate)
                .competencyByProduct(competencyByProduct)
                .competencyLevelDistribution(competencyLevelDistribution)
                .topCompetentUsers(topCompetentUsers)
                .productsToImprove(productsToImprove)
                .recentActivities(recentActivities)
                .build();
    }

    // Yetkinlik seviyesi adını döndüren yardımcı metot
    private String getCompetencyLevelName(double score) {
        if (score >= 9) return "Uzman";
        if (score >= 7) return "Deneyimli";
        if (score >= 5) return "Orta Düzey";
        return "Acemi";
    }

    // Seviyeleri sıralamak için yardımcı metot
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