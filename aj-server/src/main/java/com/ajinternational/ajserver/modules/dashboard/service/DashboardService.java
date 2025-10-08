package com.ajinternational.ajserver.modules.dashboard.service;

import com.ajinternational.ajserver.modules.audit.model.AuditLog;
import com.ajinternational.ajserver.modules.audit.repository.AuditLogRepository;
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

    private final UserRepository userRepository;
    private final MasterProductRepository masterProductRepository;
    private final UserProductKnowledgeRepository knowledgeRepository;
    private final AuditLogRepository auditLogRepository;

    private static final String MOCK_TENANT_ID = "TR"; // Geçici Tenant ID

    public DashboardSummaryDto getDashboardSummary() {

        // --- Veri Çekme ---
        List<User> allUsers = userRepository.findAll();
        List<MasterProduct> allMasterProducts = masterProductRepository.findByTenantIdAndParentProductIdIsNull(MOCK_TENANT_ID);
        List<UserProductKnowledge> allKnowledge = knowledgeRepository.findAll();

        // --- KPI Hesaplamaları ---
        long totalEmployees = allUsers.size();
        long totalMasterProducts = allMasterProducts.size();

        double averageCompetencyScore = allKnowledge.isEmpty() ? 0 : allKnowledge.stream().mapToInt(UserProductKnowledge::getScore).average().orElse(0);

        long distinctUsersWhoVoted = allKnowledge.stream().map(UserProductKnowledge::getUserId).distinct().count();
        double competencyCompletionRate = totalEmployees > 0 ? ((double) distinctUsersWhoVoted / totalEmployees) * 100 : 0;

        // --- Grafik ve Liste Verileri ---
        Map<String, MasterProduct> productMap = allMasterProducts.stream().collect(Collectors.toMap(MasterProduct::getId, Function.identity()));

        // Ürün bazında yetkinlik ortalamaları
        Map<String, Double> averageScoreByProduct = allKnowledge.stream()
                .collect(Collectors.groupingBy(UserProductKnowledge::getProductId, Collectors.averagingInt(UserProductKnowledge::getScore)));

        List<CompetencyByProductDto> competencyByProduct = averageScoreByProduct.entrySet().stream()
                .filter(entry -> productMap.containsKey(entry.getKey()))
                .map(entry -> new CompetencyByProductDto(productMap.get(entry.getKey()).getName(), entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparing(CompetencyByProductDto::getAverageScore).reversed())
                .collect(Collectors.toList());

        // Kullanıcı bazında yetkinlik ortalamaları
        Map<String, Double> averageScoreByUser = allKnowledge.stream()
                .collect(Collectors.groupingBy(UserProductKnowledge::getUserId, Collectors.averagingInt(UserProductKnowledge::getScore)));

        // Yetkinlik seviye dağılımı
        Map<String, Long> userCountByLevel = averageScoreByUser.values().stream()
                .map(this::getCompetencyLevelName)
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));

        List<CompetencyLevelDistributionDto> competencyLevelDistribution = userCountByLevel.entrySet().stream()
                .map(entry -> new CompetencyLevelDistributionDto(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparing(dto -> getLevelOrder(dto.getLevelName())))
                .collect(Collectors.toList());

        Map<String, User> userMap = allUsers.stream().collect(Collectors.toMap(User::getId, Function.identity()));

        // En yetkin kullanıcılar
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

        // Geliştirilmesi gereken ürünler
        List<CompetencyByProductDto> productsToImprove = competencyByProduct.stream()
                .sorted(Comparator.comparing(CompetencyByProductDto::getAverageScore))
                .limit(3)
                .collect(Collectors.toList());

        // Son aktiviteler
        List<AuditLog> recentActivities = auditLogRepository.findTop5ByOrderByTimestampDesc();

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