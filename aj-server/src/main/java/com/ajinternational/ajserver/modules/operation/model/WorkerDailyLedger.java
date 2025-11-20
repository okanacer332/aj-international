package com.ajinternational.ajserver.modules.operation.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDate;

@Data
@Document(collection = "operation_worker_ledgers")
@CompoundIndex(name = "ledger_idx", def = "{'tenantId': 1, 'workerId': 1, 'date': 1}", unique = true)
public class WorkerDailyLedger {
    @Id
    private String id;
    private String tenantId;
    private String workerId;
    private LocalDate date;

    private int standardShiftMinutes;
    private int usedMinutes; // Tamamlanmış işlerden gelen süre
}