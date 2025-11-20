package com.ajinternational.ajserver.modules.operation.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "operation_active_sessions")
public class ActiveSession {
    @Id
    private String id;
    private String tenantId;

    private String tableId;
    private String workerId;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private int assignedDurationMinutes;
    private double targetOutputKg;

    // YENİ EKLENDİ: Gerçekleşen Üretim
    private Double actualOutputKg;

    private boolean completed = false;

    private boolean processed;
}