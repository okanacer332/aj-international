package com.ajinternational.ajserver.modules.operation.dto;

public record TicketEntryRequest(
        String tableId,
        double amountKg
) {}