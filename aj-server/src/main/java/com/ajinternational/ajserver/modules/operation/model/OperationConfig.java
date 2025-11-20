package com.ajinternational.ajserver.modules.operation.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "operation_configs")
public class OperationConfig {
    @Id
    private String id;

    @Indexed(unique = true)
    private String tenantId;

    private int standardShiftDurationMinutes = 540; // Varsayılan 9 Saat
    private double dailyStandardTargetKg = 900.0;
}