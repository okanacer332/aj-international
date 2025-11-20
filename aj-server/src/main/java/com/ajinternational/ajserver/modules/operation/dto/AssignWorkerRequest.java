package com.ajinternational.ajserver.modules.operation.dto;

import java.util.List;

// Tekil workerId yerine List<String> workerIds geldi
public record AssignWorkerRequest(
        String tableId,
        List<String> workerIds,
        int durationMinutes // Tahmini süre (hepsi için aynı)
) {}