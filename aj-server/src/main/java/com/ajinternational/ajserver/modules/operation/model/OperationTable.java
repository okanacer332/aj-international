package com.ajinternational.ajserver.modules.operation.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "operation_tables")
public class OperationTable {
    @Id
    private String id;

    @Indexed
    private String tenantId;

    private String tableNo;
    private OperationTableUnit unitType;
    private boolean active = true;
}