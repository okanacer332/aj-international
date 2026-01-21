package com.ajinternational.ajserver.modules.masterdata.service;

import com.ajinternational.ajserver.config.TenantContextHolder;
import com.ajinternational.ajserver.modules.audit.service.AuditLogService;
import com.ajinternational.ajserver.modules.masterdata.model.MeasureDefinition;
import com.ajinternational.ajserver.modules.masterdata.repository.MeasureDefinitionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MeasureDefinitionService {

    private final MeasureDefinitionRepository measureRepository;
    private final AuditLogService auditLogService;

    // Helper for cache key generation
    public String getCurrentTenantIdForCache() {
        return TenantContextHolder.getCurrentTenantId();
    }

    // Tenant'a göre listeleme
    @Cacheable(value = "measures", key = "#root.target.getCurrentTenantIdForCache()")
    public List<MeasureDefinition> findAllMeasures() {
        UserDetails userDetails = TenantContextHolder.getCurrentUserDetails();
        String tenantId = TenantContextHolder.getCurrentTenantId();
        boolean isSuperAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (isSuperAdmin) {
            return measureRepository.findAll();
        } else {
            return measureRepository.findByTenantId(tenantId);
        }
    }

    // Tenant'a göre güvenli ID bulma
    public Optional<MeasureDefinition> findById(String id) {
        UserDetails userDetails = TenantContextHolder.getCurrentUserDetails();
        String tenantId = TenantContextHolder.getCurrentTenantId();
        boolean isSuperAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (isSuperAdmin) {
            return measureRepository.findById(id);
        } else {
            return measureRepository.findByTenantIdAndId(tenantId, id);
        }
    }

    // Kaydetme veya Güncelleme
    @CacheEvict(value = "measures", key = "#root.target.getCurrentTenantIdForCache()")
    public MeasureDefinition saveMeasure(MeasureDefinition measureFromRequest) {
        String currentTenantId = TenantContextHolder.getCurrentTenantId();
        String currentUsername = TenantContextHolder.getCurrentUsername();

        // Benzersizlik kontrolü
        measureRepository.findByTenantIdAndName(currentTenantId, measureFromRequest.getName())
                .ifPresent(existing -> {
                    if (measureFromRequest.getId() == null || !existing.getId().equals(measureFromRequest.getId())) {
                        throw new IllegalArgumentException("Bu ölçü birimi adı zaten kayıtlı.");
                    }
                });

        String logAction;
        String logDetails;
        MeasureDefinition measureToSave;

        if (measureFromRequest.getId() == null) {
            // Yeni kayıt
            measureToSave = measureFromRequest;
            measureToSave.setTenantId(currentTenantId);
            logAction = "MEASURE_DEFINITION_CREATED";
            logDetails = "Yeni ölçü birimi oluşturuldu: " + measureToSave.getName();
        } else {
            // Güncelleme
            measureToSave = findById(measureFromRequest.getId())
                    .orElseThrow(() -> new RuntimeException("Ölçü birimi bulunamadı veya yetkiniz yok."));

            measureToSave.setName(measureFromRequest.getName());

            logAction = "MEASURE_DEFINITION_UPDATED";
            logDetails = "Ölçü birimi güncellendi: " + measureToSave.getName();
        }

        MeasureDefinition savedMeasure = measureRepository.save(measureToSave);
        auditLogService.logAction(currentTenantId, currentUsername, logAction, logDetails);
        return savedMeasure;
    }

    // Silme
    @CacheEvict(value = "measures", key = "#root.target.getCurrentTenantIdForCache()")
    public void deleteMeasure(String id) {
        String currentTenantId = TenantContextHolder.getCurrentTenantId();
        String currentUsername = TenantContextHolder.getCurrentUsername();

        MeasureDefinition measureToDelete = findById(id)
                .orElseThrow(() -> new RuntimeException("Ölçü birimi bulunamadı veya silme yetkiniz yok."));

        // TODO: Bu birimi kullanan bir kayıt var mı? Kontrolü eklenebilir.

        measureRepository.delete(measureToDelete);

        String logDetails = "Ölçü birimi silindi: " + measureToDelete.getName();
        auditLogService.logAction(currentTenantId, currentUsername, "MEASURE_DEFINITION_DELETED", logDetails);
    }
}