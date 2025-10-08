package com.ajinternational.ajserver.modules.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CompetencyByProductDto {
    private String productName;
    private String productId;
    private double averageScore;
}