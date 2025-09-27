package com.ajinternational.ajserver.modules.audit.repository;

import com.ajinternational.ajserver.modules.audit.model.AuditLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends MongoRepository<AuditLog, String> {
}