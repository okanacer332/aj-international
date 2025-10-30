package com.ajinternational.ajserver.modules.audit.service;

import com.ajinternational.ajserver.config.TenantContextHolder; // Eklendi
import com.ajinternational.ajserver.modules.audit.model.AuditLog;
import com.ajinternational.ajserver.modules.audit.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UserDetails; // Eklendi
import org.springframework.stereotype.Service;

import java.util.List; // Eklendi

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final HttpServletRequest request;

    // GÜNCELLENDİ: Artık tenantId alıyor
    public void logAction(String tenantId, String username, String action, String details) {
        String ipAddress = getClientIp();
        // GÜNCELLENDİ: AuditLog kurucusu artık tenantId bekliyor
        AuditLog log = new AuditLog(tenantId, username, action, details, ipAddress);
        auditLogRepository.save(log);
    }

    // GÜNCELLENDİ: Multi-tenant veri izolasyonu eklendi
    public Page<AuditLog> getLogs(Pageable pageable) {
        UserDetails userDetails = TenantContextHolder.getCurrentUserDetails();
        String tenantId = TenantContextHolder.getCurrentTenantId();

        boolean isSuperAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (isSuperAdmin) {
            // Süper Admin tüm logları görür
            return auditLogRepository.findAll(pageable);
        } else {
            // Normal kullanıcı/admin sadece kendi tenant loglarını görür
            return auditLogRepository.findByTenantId(tenantId, pageable);
        }
    }

    // YENİ METOT: Dashboard için tenanta özel son 5 log
    public List<AuditLog> getRecentActivities() {
        UserDetails userDetails = TenantContextHolder.getCurrentUserDetails();
        String tenantId = TenantContextHolder.getCurrentTenantId();

        boolean isSuperAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (isSuperAdmin) {
            // Süper Admin tüm tenant'lardaki son 5 logu görür
            return auditLogRepository.findTop5ByOrderByTimestampDesc();
        } else {
            // Normal kullanıcı/admin sadece kendi tenant'ının son 5 logunu görür
            return auditLogRepository.findTop5ByTenantIdOrderByTimestampDesc(tenantId);
        }
    }

    private String getClientIp() {
        String remoteAddr = "";
        if (request != null) {
            remoteAddr = request.getHeader("X-FORWARDED-FOR");
            if (remoteAddr == null || "".equals(remoteAddr)) {
                remoteAddr = request.getRemoteAddr();
            }
        }
        return remoteAddr;
    }
}