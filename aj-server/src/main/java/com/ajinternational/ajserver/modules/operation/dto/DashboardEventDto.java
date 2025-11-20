package com.ajinternational.ajserver.modules.operation.dto;

import java.util.Map;

public record DashboardEventDto(
        String type, // Örn: "WORK_FINISHED"
        Map<String, String> params // Örn: { "worker": "Ali", "amount": "100" }
) {}