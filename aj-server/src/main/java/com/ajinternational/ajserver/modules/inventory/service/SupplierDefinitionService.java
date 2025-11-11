// aj-server/src/main/java/com/ajinternational/ajserver/modules/inventory/service/SupplierDefinitionService.java
package com.ajinternational.ajserver.modules.inventory.service;

import com.ajinternational.ajserver.config.TenantContextHolder;
import com.ajinternational.ajserver.modules.audit.service.AuditLogService;
import com.ajinternational.ajserver.modules.inventory.model.SupplierDefinition;
import com.ajinternational.ajserver.modules.inventory.repository.SupplierDefinitionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SupplierDefinitionService {

    private final SupplierDefinitionRepository repository;
    private final AuditLogService auditLogService;
    // TODO: Tedarikçiyi silmeden önce Giriş Fişlerinde kullanılıyor mu diye kontrol et.

    private boolean isSuperAdmin() {
        UserDetails userDetails = TenantContextHolder.getCurrentUserDetails();
        return userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }

    public List<SupplierDefinition> findAll() {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        if (isSuperAdmin()) {
            return repository.findAll();
        } else {
            return repository.findByTenantId(tenantId);
        }
    }

    public Optional<SupplierDefinition> findById(String id) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        if (isSuperAdmin()) {
            return repository.findById(id);
        } else {
            return repository.findByTenantIdAndId(tenantId, id);
        }
    }

    public SupplierDefinition save(SupplierDefinition definition) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        String username = TenantContextHolder.getCurrentUsername();
        String logAction;

        repository.findByTenantIdAndName(tenantId, definition.getName()).ifPresent(existing -> {
            if (definition.getId() == null || !existing.getId().equals(definition.getId())) {
                throw new IllegalArgumentException("Bu tedarikçi adı zaten kayıtlı.");
            }
        });

        if (definition.getId() == null) {
            definition.setTenantId(tenantId);
            logAction = "INVENTORY_SUPPLIER_CREATED";
        } else {
            SupplierDefinition existing = findById(definition.getId())
                    .orElseThrow(() -> new RuntimeException("Tedarikçi bulunamadı veya yetkiniz yok."));
            definition.setTenantId(existing.getTenantId());
            logAction = "INVENTORY_SUPPLIER_UPDATED";
        }

        SupplierDefinition saved = repository.save(definition);
        auditLogService.logAction(tenantId, username, logAction, "Tedarikçi tanımı: " + saved.getName());
        return saved;
    }

    public void delete(String id) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        String username = TenantContextHolder.getCurrentUsername();

        SupplierDefinition definition = findById(id)
                .orElseThrow(() -> new RuntimeException("Tedarikçi bulunamadı veya silme yetkiniz yok."));

        // TODO: Bağımlılık kontrolü

        repository.delete(definition);
        auditLogService.logAction(tenantId, username, "INVENTORY_SUPPLIER_DELETED", "Tedarikçi tanımı silindi: " + definition.getName());
    }
}