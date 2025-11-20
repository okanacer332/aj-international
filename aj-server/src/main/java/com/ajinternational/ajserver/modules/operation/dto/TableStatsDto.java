package com.ajinternational.ajserver.modules.operation.dto;

public record TableStatsDto(
        String tableId,
        double totalInputKg,   // Toplam Girilen
        double totalOutputKg,  // Toplam Üretilen
        double remainingKg     // Kalan
) {}