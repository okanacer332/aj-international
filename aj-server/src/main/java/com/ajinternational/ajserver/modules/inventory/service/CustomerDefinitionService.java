// aj-server/src/main/java/com/ajinternational/ajserver/modules/inventory/service/CustomerDefinitionService.java
package com.ajinternational.ajserver.modules.inventory.service;

import com.ajinternational.ajserver.config.TenantContextHolder;
import com.ajinternational.ajserver.modules.audit.service.AuditLogService;
import com.ajinternational.ajserver.modules.inventory.model.CustomerDefinition;
import com.ajinternational.ajserver.modules.inventory.repository.CustomerDefinitionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomerDefinitionService {

    private final CustomerDefinitionRepository repository;
    private final AuditLogService auditLogService;
    // TODO: Müşteriyi silmeden önce Sevk Fişlerinde kullanılıyor mu diye kontrol et.

    private boolean isSuperAdmin() {
        UserDetails userDetails = TenantContextHolder.getCurrentUserDetails();
        return userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }

    public List<CustomerDefinition> findAll() {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        if (isSuperAdmin()) {
            return repository.findAll();
        } else {
            return repository.findByTenantId(tenantId);
        }
    }

    public Optional<CustomerDefinition> findById(String id) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        if (isSuperAdmin()) {
            return repository.findById(id);
        } else {
            return repository.findByTenantIdAndId(tenantId, id);
        }
    }

    public CustomerDefinition save(CustomerDefinition definition) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        String username = TenantContextHolder.getCurrentUsername();
        String logAction;

        repository.findByTenantIdAndName(tenantId, definition.getName()).ifPresent(existing -> {
            if (definition.getId() == null || !existing.getId().equals(definition.getId())) {
                throw new IllegalArgumentException("Bu müşteri adı zaten kayıtlı.");
            }
        });

        if (definition.getId() == null) {
            definition.setTenantId(tenantId);
            logAction = "INVENTORY_CUSTOMER_CREATED";
        } else {
            CustomerDefinition existing = findById(definition.getId())
                    .orElseThrow(() -> new RuntimeException("Müşteri bulunamadı veya yetkiniz yok."));
            definition.setTenantId(existing.getTenantId());
            logAction = "INVENTORY_CUSTOMER_UPDATED";
        }

        CustomerDefinition saved = repository.save(definition);
        auditLogService.logAction(tenantId, username, logAction, "Müşteri tanımı: " + saved.getName());
        return saved;
    }

    public void delete(String id) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        String username = TenantContextHolder.getCurrentUsername();

        CustomerDefinition definition = findById(id)
                .orElseThrow(() -> new RuntimeException("Müşteri bulunamadı veya silme yetkiniz yok."));

        // TODO: Bağımlılık kontrolü

        repository.delete(definition);
        auditLogService.logAction(tenantId, username, "INVENTORY_CUSTOMER_DELETED", "Müşteri tanımı silindi: " + definition.getName());
    }
}