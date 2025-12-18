package com.ajinternational.ajserver.modules.operation.dto;

import jakarta.validation.constraints.NotNull;

public record ReleaseWorkerRequest(
        @NotNull String sessionId,
        Double remainingOnTableKg // Değişen alan: Artık masada kalanı soruyoruz
) {}