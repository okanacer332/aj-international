package com.ajinternational.ajserver.modules.operation.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record TicketEntryRequest(
        @NotNull String tableId,
        @NotNull Double amountKg,
        List<String> workerIds,
        Integer durationMinutes,
        String customDate // <--- YENİ ALAN (ISO 8601 Formatında String gelir)
) {}