package com.ajinternational.ajserver.modules.operation.dto;

public record WorkerAvailabilityDto(
        String workerId,
        String fullName,
        String onxCode,
        String avatarUrl,
        int standardShiftMinutes,
        int usedMinutes,
        int activeMinutes,
        int remainingMinutes,
        String status
) {}