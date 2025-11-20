package com.ajinternational.ajserver.modules.operation.dto;

public record SocketUpdateDto(
        String type,   // Örn: "SESSION_UPDATE", "WORKER_UPDATE"
        Object payload
) {}