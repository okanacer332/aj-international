package com.ajinternational.ajserver.modules.operation.dto;

import java.util.List;

public record FieldDashboardDto(
        int activeTables,
        int activeWorkers,
        double dailyTotalOutputKg, // Günlük Toplam Üretim (Net Veri)
        int completedSessionsCount, // Kaç kere "İş bitti" dendi?
        List<DashboardEventDto> recentEvents // Artık String değil, DTO listesi
) {}