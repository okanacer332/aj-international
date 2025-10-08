package com.ajinternational.ajserver.modules.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TopUserDto {
    private String fullName;
    private String avatarUrl;
    private double averageScore;
}