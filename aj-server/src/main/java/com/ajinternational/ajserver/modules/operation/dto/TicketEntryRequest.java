package com.ajinternational.ajserver.modules.operation.dto;

import java.util.List;

public record TicketEntryRequest(
        String tableId,
        double amountKg,
        // Opsiyonel: Fiş girerken personel de atamak için
        List<String> workerIds,
        Integer durationMinutes
) {}