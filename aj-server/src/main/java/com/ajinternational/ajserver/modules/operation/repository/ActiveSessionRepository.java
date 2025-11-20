package com.ajinternational.ajserver.modules.operation.repository;

import com.ajinternational.ajserver.modules.operation.model.ActiveSession;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ActiveSessionRepository extends MongoRepository<ActiveSession, String> {
    // Masadaki AKTİF (bitmemiş) oturumlar
    List<ActiveSession> findByTableIdAndCompletedFalse(String tableId);

    // Masadaki BİTMİŞ (tamamlanmış) oturumlar (İstatistik için gerekli)
    List<ActiveSession> findByTableIdAndCompletedTrue(String tableId);

    // İşçinin aktif oturumları
    List<ActiveSession> findByTenantIdAndWorkerIdAndCompletedFalse(String tenantId, String workerId);
}