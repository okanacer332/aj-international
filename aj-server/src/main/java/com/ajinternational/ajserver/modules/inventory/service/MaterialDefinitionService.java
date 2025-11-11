// aj-server/src/main/java/com/ajinternational/ajserver/modules/inventory/service/MaterialDefinitionService.java
package com.ajinternational.ajserver.modules.inventory.service;

import com.ajinternational.ajserver.config.TenantContextHolder;
import com.ajinternational.ajserver.modules.audit.service.AuditLogService;
import com.ajinternational.ajserver.modules.inventory.model.MaterialDefinition;
import com.ajinternational.ajserver.modules.inventory.repository.MaterialDefinitionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MaterialDefinitionService {

    private final MaterialDefinitionRepository repository;
    private final AuditLogService auditLogService;
    // TODO: Material'ı silmeden önce InventoryEntry/Dispatch'te kullanılıyor mu diye kontrol et.

    private boolean isSuperAdmin() {
        UserDetails userDetails = TenantContextHolder.getCurrentUserDetails();
        return userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }

    public List<MaterialDefinition> findAll() {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        if (isSuperAdmin()) {
            return repository.findAll();
        } else {
            return repository.findByTenantId(tenantId);
        }
    }

    public Optional<MaterialDefinition> findById(String id) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        if (isSuperAdmin()) {
            return repository.findById(id);
        } else {
            return repository.findByTenantIdAndId(tenantId, id);
        }
    }

    public MaterialDefinition save(MaterialDefinition definition) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        String username = TenantContextHolder.getCurrentUsername();
        String logAction;

        // Kod/İsim benzersizlik kontrolü (tenant bazlı)
        repository.findByTenantIdAndName(tenantId, definition.getName()).ifPresent(existing -> {
            if (definition.getId() == null || !existing.getId().equals(definition.getId())) {
                throw new IllegalArgumentException("Bu malzeme adı zaten kayıtlı.");
            }
        });
        if (definition.getCode() != null && !definition.getCode().isBlank()) {
            repository.findByTenantIdAndCode(tenantId, definition.getCode()).ifPresent(existing -> {
                if (definition.getId() == null || !existing.getId().equals(definition.getId())) {
                    throw new IllegalArgumentException("Bu malzeme kodu zaten kayıtlı.");
                }
            });
        }


        if (definition.getId() == null) {
            definition.setTenantId(tenantId);
            logAction = "INVENTORY_MATERIAL_CREATED";
        } else {
            MaterialDefinition existing = findById(definition.getId())
                    .orElseThrow(() -> new RuntimeException("Malzeme bulunamadı veya yetkiniz yok."));
            definition.setTenantId(existing.getTenantId()); // Tenant ID'nin değişmediğinden emin ol
            logAction = "INVENTORY_MATERIAL_UPDATED";
        }

        MaterialDefinition saved = repository.save(definition);
        auditLogService.logAction(tenantId, username, logAction, "Malzeme tanımı: " + saved.getName());
        return saved;
    }

    public void delete(String id) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        String username = TenantContextHolder.getCurrentUsername();

        MaterialDefinition definition = findById(id)
                .orElseThrow(() -> new RuntimeException("Malzeme bulunamadı veya silme yetkiniz yok."));

        // TODO: Bağımlılık kontrolü (örn: Stokta bu malzeme var mı?)

        repository.delete(definition);
        auditLogService.logAction(tenantId, username, "INVENTORY_MATERIAL_DELETED", "Malzeme tanımı silindi: " + definition.getName());
    }
}