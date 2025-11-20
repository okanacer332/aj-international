package com.ajinternational.ajserver.modules.operation.repository;
import com.ajinternational.ajserver.modules.operation.model.OperationTable;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface OperationTableRepository extends MongoRepository<OperationTable, String> {
    List<OperationTable> findByTenantId(String tenantId);
}