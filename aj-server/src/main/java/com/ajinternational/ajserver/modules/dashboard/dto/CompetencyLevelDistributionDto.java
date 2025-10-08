package com.ajinternational.ajserver.modules.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CompetencyLevelDistributionDto {
    private String levelName;
    private long userCount;
}