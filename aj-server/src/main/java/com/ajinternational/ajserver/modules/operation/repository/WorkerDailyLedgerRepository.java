package com.ajinternational.ajserver.modules.operation.repository;
import com.ajinternational.ajserver.modules.operation.model.WorkerDailyLedger;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.time.LocalDate;
import java.util.Optional;

public interface WorkerDailyLedgerRepository extends MongoRepository<WorkerDailyLedger, String> {
    Optional<WorkerDailyLedger> findByTenantIdAndWorkerIdAndDate(String tenantId, String workerId, LocalDate date);
}