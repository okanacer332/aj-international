package com.ajinternational.ajserver.modules.masterdata.service;

import com.ajinternational.ajserver.config.TenantContextHolder;
import com.ajinternational.ajserver.modules.audit.service.AuditLogService;
import com.ajinternational.ajserver.modules.masterdata.model.ServiceDefinition;
import com.ajinternational.ajserver.modules.masterdata.repository.ServiceDefinitionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ServiceDefinitionService {

    private final ServiceDefinitionRepository serviceRepository;
    private final AuditLogService auditLogService;

    // Helper method for cache key generation
    public String getCurrentTenantIdForCache() {
        return TenantContextHolder.getCurrentTenantId();
    }

    // Tenant'a göre listeleme - Cached for 24 hours
    @Cacheable(value = "services", key = "#root.target.getCurrentTenantIdForCache()")
    public List<ServiceDefinition> findAllServices() {
        UserDetails userDetails = TenantContextHolder.getCurrentUserDetails();
        String tenantId = TenantContextHolder.getCurrentTenantId();
        boolean isSuperAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (isSuperAdmin) {
            return serviceRepository.findAll();
        } else {
            return serviceRepository.findByTenantId(tenantId);
        }
    }

    // Tenant'a göre güvenli ID bulma
    public Optional<ServiceDefinition> findById(String id) {
        UserDetails userDetails = TenantContextHolder.getCurrentUserDetails();
        String tenantId = TenantContextHolder.getCurrentTenantId();
        boolean isSuperAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (isSuperAdmin) {
            return serviceRepository.findById(id);
        } else {
            return serviceRepository.findByTenantIdAndId(tenantId, id);
        }
    }

    // Kaydetme veya Güncelleme - Evicts cache on save
    @CacheEvict(value = "services", key = "#root.target.getCurrentTenantIdForCache()")
    public ServiceDefinition saveService(ServiceDefinition serviceFromRequest) {
        String currentTenantId = TenantContextHolder.getCurrentTenantId();
        String currentUsername = TenantContextHolder.getCurrentUsername();

        // Plaka benzersizlik kontrolü
        serviceRepository.findByTenantIdAndVehiclePlate(currentTenantId, serviceFromRequest.getVehiclePlate())
                .ifPresent(existing -> {
                    if (serviceFromRequest.getId() == null || !existing.getId().equals(serviceFromRequest.getId())) {
                        throw new IllegalArgumentException("Bu araç plakası zaten kayıtlı.");
                    }
                });

        String logAction;
        String logDetails;
        ServiceDefinition serviceToSave;

        if (serviceFromRequest.getId() == null) {
            // Yeni kayıt
            serviceToSave = serviceFromRequest;
            serviceToSave.setTenantId(currentTenantId);
            logAction = "SERVICE_DEFINITION_CREATED";
            logDetails = "Yeni servis aracı oluşturuldu: " + serviceToSave.getVehiclePlate();
        } else {
            // Güncelleme
            serviceToSave = findById(serviceFromRequest.getId())
                    .orElseThrow(() -> new RuntimeException("Servis bilgisi bulunamadı veya yetkiniz yok."));

            serviceToSave.setDriverName(serviceFromRequest.getDriverName());
            serviceToSave.setPhone(serviceFromRequest.getPhone());
            serviceToSave.setVehiclePlate(serviceFromRequest.getVehiclePlate());
            serviceToSave.setVehicleCapacity(serviceFromRequest.getVehicleCapacity());

            logAction = "SERVICE_DEFINITION_UPDATED";
            logDetails = "Servis aracı güncellendi: " + serviceToSave.getVehiclePlate();
        }

        ServiceDefinition savedService = serviceRepository.save(serviceToSave);
        auditLogService.logAction(currentTenantId, currentUsername, logAction, logDetails);
        return savedService;
    }

    // Silme - Evicts cache on delete
    @CacheEvict(value = "services", key = "#root.target.getCurrentTenantIdForCache()")
    public void deleteService(String id) {
        String currentTenantId = TenantContextHolder.getCurrentTenantId();
        String currentUsername = TenantContextHolder.getCurrentUsername();

        ServiceDefinition serviceToDelete = findById(id)
                .orElseThrow(() -> new RuntimeException("Servis bilgisi bulunamadı veya silme yetkiniz yok."));

        // TODO: Bu servisi kullanan personel var mı? Kontrolü eklenebilir.

        serviceRepository.delete(serviceToDelete);

        String logDetails = "Servis aracı silindi: " + serviceToDelete.getVehiclePlate();
        auditLogService.logAction(currentTenantId, currentUsername, "SERVICE_DEFINITION_DELETED", logDetails);
    }
}