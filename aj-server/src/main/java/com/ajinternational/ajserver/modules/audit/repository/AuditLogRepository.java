package com.ajinternational.ajserver.modules.audit.repository;

import com.ajinternational.ajserver.modules.audit.model.AuditLog;
import org.springframework.data.domain.Page; // Page eklendi
import org.springframework.data.domain.Pageable; // Pageable eklendi
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends MongoRepository<AuditLog, String> {

    List<AuditLog> findTop5ByOrderByTimestampDesc();

    // YENİ EKLENEN METOT: Logları tenanta göre sayfalı getirmek için
    Page<AuditLog> findByTenantId(String tenantId, Pageable pageable);

    // YENİ EKLENEN METOT: Dashboard için tenanta göre son 5 logu getirmek için
    List<AuditLog> findTop5ByTenantIdOrderByTimestampDesc(String tenantId);
}