package com.ajinternational.ajserver.modules.operation.dto;

public record ReleaseWorkerRequest(
        String sessionId,
        Double actualOutputKg // YENİ EKLENDİ
) {}