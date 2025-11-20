package com.ajinternational.ajserver.modules.operation.dto;

import java.time.LocalDateTime;

public record TableSessionDto(
        String sessionId,
        String workerId,
        String workerName,
        String avatarUrl,
        LocalDateTime startTime,
        int assignedDurationMinutes,
        double targetOutputKg
) {}