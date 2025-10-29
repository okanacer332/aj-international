package com.ajinternational.ajserver.modules.audit.repository;

import com.ajinternational.ajserver.modules.audit.model.AuditLog;
import org.springframework.data.domain.Page; // Page importu eklendi
import org.springframework.data.domain.Pageable; // Pageable importu eklendi
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends MongoRepository<AuditLog, String> {

    // Bu metot dashboard için kullanılabilir, tenant bazlı değil (şimdilik)
    List<AuditLog> findTop5ByOrderByTimestampDesc();

    // --- YENİ METOTLAR ---

    /**
     * Belirli bir tenant'a ait logları sayfalanmış olarak, en yeniden eskiye doğru getirir.
     * @param tenantId Tenant ID (Ülke Kodu)
     * @param pageable Sayfalama ve sıralama bilgisi
     * @return O tenant'a ait logların sayfası
     */
    Page<AuditLog> findByTenantId(String tenantId, Pageable pageable);

    /**
     * Belirli bir tenant'a ait en son 5 log kaydını getirir. (Dashboard için tenant bazlı alternatif)
     * @param tenantId Tenant ID (Ülke Kodu)
     * @return O tenant'a ait en son 5 log
     */
    List<AuditLog> findTop5ByTenantIdOrderByTimestampDesc(String tenantId);

    // --- YENİ METOTLAR SONU ---
}