package com.ajinternational.ajserver.modules.dashboard.dto;

import com.ajinternational.ajserver.modules.audit.model.AuditLog;
import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class DashboardSummaryDto {
    // KPI Kartları için
    private long totalEmployees;
    private long totalMasterProducts;
    private double averageCompetencyScore;
    private double competencyCompletionRate;

    // Grafikler ve Listeler için
    private List<CompetencyByProductDto> competencyByProduct;
    private List<CompetencyLevelDistributionDto> competencyLevelDistribution;
    private List<TopUserDto> topCompetentUsers;
    private List<CompetencyByProductDto> productsToImprove; // competencyByProduct DTO'sunu yeniden kullanabiliriz
    private List<AuditLog> recentActivities;
}