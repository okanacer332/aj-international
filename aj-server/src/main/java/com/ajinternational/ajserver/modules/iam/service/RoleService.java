package com.ajinternational.ajserver.modules.iam.service;

import com.ajinternational.ajserver.config.TenantContextHolder;
import com.ajinternational.ajserver.modules.audit.service.AuditLogService;
import com.ajinternational.ajserver.modules.iam.model.Role;
import com.ajinternational.ajserver.modules.iam.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final AuditLogService auditLogService; // Eklendi

    // Helper for cache key generation
    public String getCurrentTenantIdForCache() {
        return TenantContextHolder.getCurrentTenantId();
    }

    @CacheEvict(value = "roles", key = "#root.target.getCurrentTenantIdForCache()")
    public Role createRole(Role role) {
        String currentTenantId = TenantContextHolder.getCurrentTenantId();
        String currentUsername = TenantContextHolder.getCurrentUsername();

        // GÜNCELLENDİ: Rolü oluştururken mevcut tenantId'yi ata
        role.setTenantId(currentTenantId);

        // GÜNCELLENDİ: Benzersizlik kontrolünü global değil, tenant bazlı yap
        if (roleRepository.findByTenantIdAndName(currentTenantId, role.getName()).isPresent()) {
            throw new IllegalArgumentException("Bu rol adı bu ülkede (tenant) zaten mevcut: " + role.getName());
        }

        Role savedRole = roleRepository.save(role);

        // EKLENDİ: Loglama
        auditLogService.logAction(currentTenantId, currentUsername, "ROLE_CREATED",
                "Yeni rol oluşturuldu: " + savedRole.getName());

        return savedRole;
    }

    @Cacheable(value = "roles", key = "#root.target.getCurrentTenantIdForCache()")
    public List<Role> getAllRoles() {
        // GÜNCELLENDİ: Multi-tenant izolasyon
        UserDetails userDetails = TenantContextHolder.getCurrentUserDetails();
        String tenantId = TenantContextHolder.getCurrentTenantId();

        boolean isSuperAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (isSuperAdmin) {
            return roleRepository.findAll(); // Süper Admin tüm rolleri görür
        } else {
            return roleRepository.findByTenantId(tenantId); // Diğerleri sadece kendi tenant'ının rollerini görür
        }
    }

    public Optional<Role> getRoleById(String id) {
        // GÜNCELLENDİ: Multi-tenant izolasyon
        UserDetails userDetails = TenantContextHolder.getCurrentUserDetails();
        String tenantId = TenantContextHolder.getCurrentTenantId();

        boolean isSuperAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (isSuperAdmin) {
            return roleRepository.findById(id); // Süper Admin ID ile her tenant'tan çekebilir
        } else {
            return roleRepository.findByTenantIdAndId(tenantId, id); // Sadece kendi tenant'ından çekebilir
        }
    }

    @CacheEvict(value = "roles", key = "#root.target.getCurrentTenantIdForCache()")
    public Role updateRole(String id, Role roleDetails) {
        // GÜNCELLENDİ: getRoleById metodu artık tenant güvenli.
        Role role = this.getRoleById(id)
                .orElseThrow(() -> new RuntimeException("Rol bulunamadı veya bu role erişim yetkiniz yok: " + id));

        // Rol adının başka bir rolde kullanılıp kullanılmadığını (kendi tenant'ı
        // içinde) kontrol et
        Optional<Role> existingRoleWithName = roleRepository.findByTenantIdAndName(role.getTenantId(),
                roleDetails.getName());
        if (existingRoleWithName.isPresent() && !existingRoleWithName.get().getId().equals(id)) {
            throw new IllegalArgumentException("Bu rol adı zaten başka bir role ait: " + roleDetails.getName());
        }

        role.setName(roleDetails.getName());
        role.setPermissions(roleDetails.getPermissions());

        Role updatedRole = roleRepository.save(role);

        // EKLENDİ: Loglama
        auditLogService.logAction(
                role.getTenantId(),
                TenantContextHolder.getCurrentUsername(),
                "ROLE_UPDATED",
                "Rol güncellendi: " + updatedRole.getName());

        return updatedRole;
    }

    @CacheEvict(value = "roles", key = "#root.target.getCurrentTenantIdForCache()")
    public void deleteRole(String id) {
        // GÜNCELLENDİ: getRoleById metodu artık tenant güvenli.
        Role roleToDelete = this.getRoleById(id)
                .orElseThrow(() -> new RuntimeException("Rol bulunamadı veya bu rolü silme yetkiniz yok: " + id));

        String roleName = roleToDelete.getName();
        String tenantId = roleToDelete.getTenantId();

        // Not: Bu rolü kullanan kullanıcılar varsa ne yapılacağına dair iş mantığı
        // eklenebilir.
        // Şimdilik direkt siliyoruz.
        roleRepository.deleteById(id);

        // EKLENDİ: Loglama
        auditLogService.logAction(
                tenantId,
                TenantContextHolder.getCurrentUsername(),
                "ROLE_DELETED",
                "Rol silindi: " + roleName);
    }
}