package com.ajinternational.ajserver.modules.audit.service;

// --- YENİ IMPORTLAR ---
import com.ajinternational.ajserver.config.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
// --- YENİ IMPORTLAR SONU ---
import com.ajinternational.ajserver.modules.audit.model.AuditLog;
import com.ajinternational.ajserver.modules.audit.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List; // List importu eklendi

@Service
@RequiredArgsConstructor
public class AuditLogService {

    // --- Logger eklendi ---
    private static final Logger logger = LoggerFactory.getLogger(AuditLogService.class);
    // --- Logger eklendi sonu ---

    private final AuditLogRepository auditLogRepository;
    private final HttpServletRequest request; // IP adresi almak için tutulabilir

    // --- Yardımcı metot eklendi ---
    private String getCurrentTenantId() {
        String tenantId = TenantContext.getCurrentTenant();
        // Loglama işlemi kritik olduğu için tenantId null ise hata fırlatmak yerine loglayıp devam edebiliriz
        // Veya "SYSTEM" gibi bir varsayılan tenantId kullanabiliriz. Proje kararı.
        if (tenantId == null) {
            logger.error("Audit log oluşturulurken geçerli Tenant ID bulunamadı! 'UNKNOWN' kullanılacak.");
            return "UNKNOWN"; // Veya null dönebilir veya hata fırlatabiliriz.
            // throw new IllegalStateException("Tenant ID context'te bulunamadı.");
        }
        return tenantId;
    }
    // --- Yardımcı metot sonu ---


    // Bu metot log oluşturmak için
    public void logAction(String username, String action, String details) {
        // --- DEĞİŞİKLİK: TenantContext'ten tenantId alınıp log nesnesine eklendi ---
        String currentTenantId = getCurrentTenantId();
        String ipAddress = getClientIp();
        AuditLog log = new AuditLog(currentTenantId, username, action, details, ipAddress);
        auditLogRepository.save(log);
        logger.debug("Audit Log kaydedildi: Tenant={}, User={}, Action={}", currentTenantId, username, action);
        // --- DEĞİŞİKLİK SONU ---
    }

    // Logları sayfalayarak getirmek için
    public Page<AuditLog> getLogs(Pageable pageable) {
        // --- DEĞİŞİKLİK: TenantContext'ten tenantId alınıp repository metodu çağrıldı ---
        String currentTenantId = getCurrentTenantId();
        logger.debug("Tenant '{}' için audit logları getiriliyor. Sayfa: {}, Boyut: {}", currentTenantId, pageable.getPageNumber(), pageable.getPageSize());
        return auditLogRepository.findByTenantId(currentTenantId, pageable);
        // --- DEĞİŞİKLİK SONU ---
    }

    // Dashboard için en son 5 logu getirir (tenant bazlı)
    public List<AuditLog> getRecentLogsForDashboard() {
        String currentTenantId = getCurrentTenantId();
        logger.debug("Tenant '{}' için son 5 audit logu getiriliyor.", currentTenantId);
        return auditLogRepository.findTop5ByTenantIdOrderByTimestampDesc(currentTenantId);
    }

    private String getClientIp() {
        String remoteAddr = "";
        if (request != null) {
            remoteAddr = request.getHeader("X-FORWARDED-FOR");
            if (remoteAddr == null || "".equals(remoteAddr)) {
                remoteAddr = request.getRemoteAddr();
            }
        }
        // Birden fazla IP varsa ilkini al (proxy durumları için)
        if (remoteAddr != null && remoteAddr.contains(",")) {
            remoteAddr = remoteAddr.split(",")[0].trim();
        }
        return remoteAddr;
    }
}