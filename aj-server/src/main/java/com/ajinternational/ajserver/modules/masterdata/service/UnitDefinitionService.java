package com.ajinternational.ajserver.modules.masterdata.service;

import com.ajinternational.ajserver.config.TenantContextHolder;
import com.ajinternational.ajserver.modules.audit.service.AuditLogService;
import com.ajinternational.ajserver.modules.masterdata.model.UnitDefinition;
import com.ajinternational.ajserver.modules.masterdata.repository.UnitDefinitionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UnitDefinitionService {

    private final UnitDefinitionRepository unitRepository;
    private final AuditLogService auditLogService;

    // Tenant'a göre listeleme
    public List<UnitDefinition> findAllUnits() {
        UserDetails userDetails = TenantContextHolder.getCurrentUserDetails();
        String tenantId = TenantContextHolder.getCurrentTenantId();
        boolean isSuperAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (isSuperAdmin) {
            return unitRepository.findAll();
        } else {
            return unitRepository.findByTenantId(tenantId);
        }
    }

    // Tenant'a göre güvenli ID bulma
    public Optional<UnitDefinition> findById(String id) {
        UserDetails userDetails = TenantContextHolder.getCurrentUserDetails();
        String tenantId = TenantContextHolder.getCurrentTenantId();
        boolean isSuperAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (isSuperAdmin) {
            return unitRepository.findById(id);
        } else {
            return unitRepository.findByTenantIdAndId(tenantId, id);
        }
    }

    // Kaydetme veya Güncelleme
    public UnitDefinition saveUnit(UnitDefinition unit) {
        String currentTenantId = TenantContextHolder.getCurrentTenantId();
        String currentUsername = TenantContextHolder.getCurrentUsername();

        // Benzersizlik kontrolü
        unitRepository.findByTenantIdAndDepartmentNameAndUnitName(currentTenantId, unit.getDepartmentName(), unit.getUnitName())
                .ifPresent(existing -> {
                    if (unit.getId() == null || !existing.getId().equals(unit.getId())) {
                        throw new IllegalArgumentException("Bu departman ve ünite adı zaten kayıtlı.");
                    }
                });

        String logAction;
        String logDetails;

        if (unit.getId() == null) {
            // Yeni kayıt
            unit.setTenantId(currentTenantId);
            logAction = "UNIT_DEFINITION_CREATED";
            logDetails = "Yeni birim oluşturuldu: " + unit.getDepartmentName() + " / " + unit.getUnitName();
        } else {
            // Güncelleme
            UnitDefinition existing = findById(unit.getId())
                    .orElseThrow(() -> new RuntimeException("Birim bulunamadı veya yetkiniz yok."));
            unit.setTenantId(existing.getTenantId()); // TenantId'nin değiştirilmediğinden emin ol
            logAction = "UNIT_DEFINITION_UPDATED";
            logDetails = "Birim güncellendi: " + unit.getDepartmentName() + " / " + unit.getUnitName();
        }

        UnitDefinition savedUnit = unitRepository.save(unit);
        auditLogService.logAction(currentTenantId, currentUsername, logAction, logDetails);
        return savedUnit;
    }

    // Silme
    public void deleteUnit(String id) {
        String currentTenantId = TenantContextHolder.getCurrentTenantId();
        String currentUsername = TenantContextHolder.getCurrentUsername();

        UnitDefinition unitToDelete = findById(id)
                .orElseThrow(() -> new RuntimeException("Birim bulunamadı veya silme yetkiniz yok."));

        // TODO: Bu birimi kullanan personel var mı? Kontrolü eklenebilir.

        unitRepository.delete(unitToDelete);

        String logDetails = "Birim silindi: " + unitToDelete.getDepartmentName() + " / " + unitToDelete.getUnitName();
        auditLogService.logAction(currentTenantId, currentUsername, "UNIT_DEFINITION_DELETED", logDetails);
    }
}