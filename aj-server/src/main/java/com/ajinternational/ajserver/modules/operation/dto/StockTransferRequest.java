package com.ajinternational.ajserver.modules.operation.dto;

public record StockTransferRequest(
        String fromTableId,
        String toTableId,
        Double amountKg
) {}