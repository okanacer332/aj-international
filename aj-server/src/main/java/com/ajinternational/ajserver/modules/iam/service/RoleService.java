package com.ajinternational.ajserver.modules.iam.service;

// --- YENİ IMPORTLAR ---
import com.ajinternational.ajserver.config.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
// --- YENİ IMPORTLAR SONU ---
import com.ajinternational.ajserver.modules.iam.model.Role;
import com.ajinternational.ajserver.modules.iam.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RoleService {

    // --- Logger eklendi ---
    private static final Logger logger = LoggerFactory.getLogger(RoleService.class);
    // --- Logger eklendi sonu ---

    private final RoleRepository roleRepository;

    // --- Yardımcı metot eklendi ---
    private String getCurrentTenantId() {
        String tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null) {
            logger.error("Rol işlemi sırasında geçerli Tenant ID bulunamadı!");
            throw new IllegalStateException("Tenant ID context'te bulunamadı.");
        }
        return tenantId;
    }
    // --- Yardımcı metot sonu ---

    public Role createRole(Role role) {
        String currentTenantId = getCurrentTenantId();
        role.setTenantId(currentTenantId); // Tenant ID'yi ata

        // --- DEĞİŞİKLİK: findByName yerine findByTenantIdAndName kullanıldı ---
        if (roleRepository.findByTenantIdAndName(currentTenantId, role.getName()).isPresent()) {
            logger.error("HATA: Tenant '{}' - Rol adı '{}' zaten mevcut. Yeni rol oluşturulamadı.", currentTenantId, role.getName());
            throw new IllegalArgumentException("Bu rol adı zaten mevcut: " + role.getName());
        }
        // --- DEĞİŞİKLİK SONU ---
        Role savedRole = roleRepository.save(role);
        logger.info("Yeni rol oluşturuldu: Tenant={}, RoleName={}", currentTenantId, savedRole.getName());
        return savedRole;
    }

    public List<Role> getAllRoles() {
        String currentTenantId = getCurrentTenantId();
        logger.debug("Tenant '{}' için tüm roller listeleniyor.", currentTenantId);
        // --- DEĞİŞİKLİK: findAll yerine findByTenantId kullanıldı ---
        return roleRepository.findByTenantId(currentTenantId);
        // --- DEĞİŞİKLİK SONU ---
    }

    public Optional<Role> getRoleById(String id) {
        String currentTenantId = getCurrentTenantId();
        logger.debug("Tenant '{}' için ID'si '{}' olan rol aranıyor.", currentTenantId, id);
        // --- DEĞİŞİKLİK: findById yerine findByIdAndTenantId kullanıldı ---
        return roleRepository.findByIdAndTenantId(id, currentTenantId);
        // --- DEĞİŞİKLİK SONU ---
    }

    public Role updateRole(String id, Role roleDetails) {
        String currentTenantId = getCurrentTenantId();
        // --- DEĞİŞİKLİK: findById yerine findByIdAndTenantId kullanıldı ---
        Role role = roleRepository.findByIdAndTenantId(id, currentTenantId)
                .orElseThrow(() -> {
                    logger.error("Güncelleme Hatası: Tenant '{}' için ID'si '{}' olan rol bulunamadı.", currentTenantId, id);
                    return new RuntimeException("Rol bulunamadı: " + id);
                });
        // --- DEĞİŞİKLİK SONU ---

        // Rol adının başka bir rolde kullanılıp kullanılmadığını kontrol et (aynı tenant içinde)
        // --- DEĞİŞİKLİK: findByName yerine findByTenantIdAndName kullanıldı ---
        Optional<Role> existingRoleWithName = roleRepository.findByTenantIdAndName(currentTenantId, roleDetails.getName());
        if (existingRoleWithName.isPresent() && !existingRoleWithName.get().getId().equals(id)) {
            logger.error("HATA: Tenant '{}' - Rol adı '{}' zaten başka bir role ait. Rol ({}) güncellenemedi.", currentTenantId, roleDetails.getName(), id);
            throw new IllegalArgumentException("Bu rol adı zaten başka bir role ait: " + roleDetails.getName());
        }
        // --- DEĞİŞİKLİK SONU ---

        role.setName(roleDetails.getName());
        role.setPermissions(roleDetails.getPermissions());
        // Tenant ID değişmemeli, bu yüzden onu set etmiyoruz.
        Role updatedRole = roleRepository.save(role);
        logger.info("Rol güncellendi: Tenant={}, RoleName={}", currentTenantId, updatedRole.getName());
        return updatedRole;
    }

    public void deleteRole(String id) {
        String currentTenantId = getCurrentTenantId();
        // --- DEĞİŞİKLİK: Silmeden önce rolün doğru tenanta ait olduğunu kontrol et ---
        Role roleToDelete = roleRepository.findByIdAndTenantId(id, currentTenantId)
                .orElseThrow(() -> {
                    logger.error("Silme Hatası: Tenant '{}' için ID'si '{}' olan rol bulunamadı.", currentTenantId, id);
                    return new RuntimeException("Silinecek rol bulunamadı: " + id);
                });
        // --- DEĞİŞİKLİK SONU ---

        // Not: Bu rolü kullanan kullanıcılar varsa ne yapılacağına dair iş mantığı eklenebilir.
        // Örneğin, kullanıcıların rol ID'lerini güncellemek veya silmeyi engellemek.
        // Şimdilik direkt siliyoruz.
        roleRepository.deleteById(id); // ID ile silme yeterli
        logger.info("Rol silindi: Tenant={}, RoleId={}", currentTenantId, id);
    }
}