// aj-server/src/main/java/com/ajinternational/ajserver/modules/inventory/service/DepotDefinitionService.java
package com.ajinternational.ajserver.modules.inventory.service;

import com.ajinternational.ajserver.config.TenantContextHolder;
import com.ajinternational.ajserver.modules.audit.service.AuditLogService;
import com.ajinternational.ajserver.modules.inventory.model.DepotDefinition;
import com.ajinternational.ajserver.modules.inventory.repository.DepotDefinitionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DepotDefinitionService {

    private final DepotDefinitionRepository repository;
    private final AuditLogService auditLogService;
    // TODO: Depo'yu silmeden önce stokta kaydı var mı diye kontrol et.

    private boolean isSuperAdmin() {
        UserDetails userDetails = TenantContextHolder.getCurrentUserDetails();
        return userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }

    public List<DepotDefinition> findAll() {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        if (isSuperAdmin()) {
            return repository.findAll();
        } else {
            return repository.findByTenantId(tenantId);
        }
    }

    public Optional<DepotDefinition> findById(String id) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        if (isSuperAdmin()) {
            return repository.findById(id);
        } else {
            return repository.findByTenantIdAndId(tenantId, id);
        }
    }

    public DepotDefinition save(DepotDefinition definition) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        String username = TenantContextHolder.getCurrentUsername();
        String logAction;

        repository.findByTenantIdAndName(tenantId, definition.getName()).ifPresent(existing -> {
            if (definition.getId() == null || !existing.getId().equals(definition.getId())) {
                throw new IllegalArgumentException("Bu depo adı zaten kayıtlı.");
            }
        });

        if (definition.getId() == null) {
            definition.setTenantId(tenantId);
            logAction = "INVENTORY_DEPOT_CREATED";
        } else {
            DepotDefinition existing = findById(definition.getId())
                    .orElseThrow(() -> new RuntimeException("Depo bulunamadı veya yetkiniz yok."));
            definition.setTenantId(existing.getTenantId());
            logAction = "INVENTORY_DEPOT_UPDATED";
        }

        DepotDefinition saved = repository.save(definition);
        auditLogService.logAction(tenantId, username, logAction, "Depo tanımı: " + saved.getName());
        return saved;
    }

    public void delete(String id) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        String username = TenantContextHolder.getCurrentUsername();

        DepotDefinition definition = findById(id)
                .orElseThrow(() -> new RuntimeException("Depo bulunamadı veya silme yetkiniz yok."));

        // TODO: Bağımlılık kontrolü (Stokta bu depo kullanılıyor mu?)

        repository.delete(definition);
        auditLogService.logAction(tenantId, username, "INVENTORY_DEPOT_DELETED", "Depo tanımı silindi: " + definition.getName());
    }
}