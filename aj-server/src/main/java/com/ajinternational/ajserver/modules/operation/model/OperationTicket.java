package com.ajinternational.ajserver.modules.operation.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "operation_tickets")
public class OperationTicket {
    @Id
    private String id;

    @Indexed
    private String tenantId;

    @Indexed
    private String tableId;

    private double amountKg; // Fiş Miktarı
    private LocalDateTime createdAt;
    private String createdBy;

    private boolean processed;
}