package com.ajinternational.ajserver.modules.operation.repository;
import com.ajinternational.ajserver.modules.operation.model.OperationConfig;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface OperationConfigRepository extends MongoRepository<OperationConfig, String> {
    Optional<OperationConfig> findByTenantId(String tenantId);
}