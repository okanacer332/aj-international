package com.ajinternational.ajserver.modules.masterdata.service;

import com.ajinternational.ajserver.config.TenantContextHolder;
import com.ajinternational.ajserver.modules.audit.service.AuditLogService;
import com.ajinternational.ajserver.modules.masterdata.model.ProductionUnitDefinition;
import com.ajinternational.ajserver.modules.masterdata.repository.ProductionUnitDefinitionRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProductionUnitDefinitionService {

    private static final Logger logger = LoggerFactory.getLogger(ProductionUnitDefinitionService.class);

    private final ProductionUnitDefinitionRepository productionUnitRepository;
    private final AuditLogService auditLogService;
    // TODO: Bağımlılık kontrolü için (örn: PersonnelRepository) eklenebilir, şimdilik gerek yok.

    private boolean isSuperAdmin() {
        UserDetails userDetails = TenantContextHolder.getCurrentUserDetails();
        return userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }

    public List<ProductionUnitDefinition> findAllHierarchicalUnits() {
        String tenantId = TenantContextHolder.getCurrentTenantId();

        List<ProductionUnitDefinition> allUnits = isSuperAdmin()
                ? productionUnitRepository.findAll()
                : productionUnitRepository.findByTenantId(tenantId);

        logger.info("Tenant '{}' için tüm üretim birimleri çekildi: {} adet.", tenantId, allUnits.size());

        Map<String, ProductionUnitDefinition> unitMap = new HashMap<>();
        allUnits.forEach(unit -> {
            unit.setSubUnits(new ArrayList<>());
            unitMap.put(unit.getId(), unit);
        });

        List<ProductionUnitDefinition> rootUnits = new ArrayList<>();
        allUnits.forEach(unit -> {
            Optional<String> parentIdOpt = unit.getParentProductionUnitId().filter(s -> !s.trim().isEmpty());
            if (parentIdOpt.isPresent()) {
                ProductionUnitDefinition parent = unitMap.get(parentIdOpt.get());
                if (parent != null) {
                    parent.getSubUnits().add(unit);
                } else {
                    logger.warn("Alt birim '{}' ({}) için ana birim ID'si '{}' bulundu ancak map'te yok!", unit.getName(), unit.getId(), parentIdOpt.get());
                }
            } else {
                rootUnits.add(unit);
            }
        });
        logger.info("Üretim birimi hiyerarşisi kuruldu. Kök grup sayısı: {}", rootUnits.size());
        return rootUnits;
    }

    public Optional<ProductionUnitDefinition> findById(String id) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        return isSuperAdmin()
                ? productionUnitRepository.findById(id)
                : productionUnitRepository.findByTenantIdAndId(tenantId, id);
    }

    public ProductionUnitDefinition saveUnit(ProductionUnitDefinition unitFromRequest) {
        String currentTenantId = TenantContextHolder.getCurrentTenantId();
        String currentUsername = TenantContextHolder.getCurrentUsername();

        String rawParentId = unitFromRequest.getParentProductionUnitId().orElse(null);
        String finalParentId = (rawParentId != null && !rawParentId.trim().isEmpty() && !rawParentId.equals("null")) ? rawParentId.trim() : null;
        unitFromRequest.setParentProductionUnitId(finalParentId);

        productionUnitRepository.findByTenantIdAndParentProductionUnitIdAndName(currentTenantId, finalParentId, unitFromRequest.getName())
                .ifPresent(existing -> {
                    if (unitFromRequest.getId() == null || !existing.getId().equals(unitFromRequest.getId())) {
                        throw new IllegalArgumentException("Bu Grup/Bölüm adı bu seviyede zaten kayıtlı.");
                    }
                });

        String logAction;
        String logDetails;
        ProductionUnitDefinition unitToSave;

        if (unitFromRequest.getId() == null) {
            unitToSave = unitFromRequest;
            unitToSave.setTenantId(currentTenantId);
            logAction = "PRODUCTION_UNIT_CREATED";
            logDetails = (finalParentId == null ? "Yeni Üretim Grubu: " : "Yeni Üretim Bölümü: ") + unitToSave.getName();
        } else {
            unitToSave = findById(unitFromRequest.getId())
                    .orElseThrow(() -> new RuntimeException("Birim bulunamadı veya yetkiniz yok."));

            unitToSave.setName(unitFromRequest.getName());
            unitToSave.setParentProductionUnitId(finalParentId);
            // competencyRequired gibi diğer alanlar burada yok.

            logAction = "PRODUCTION_UNIT_UPDATED";
            logDetails = "Üretim Birimi güncellendi: " + unitToSave.getName();
        }

        ProductionUnitDefinition savedUnit = productionUnitRepository.save(unitToSave);
        auditLogService.logAction(currentTenantId, currentUsername, logAction, logDetails);
        return savedUnit;
    }

    public void deleteUnit(String id) {
        String currentTenantId = TenantContextHolder.getCurrentTenantId();
        String currentUsername = TenantContextHolder.getCurrentUsername();

        ProductionUnitDefinition unitToDelete = findById(id)
                .orElseThrow(() -> new RuntimeException("Birim bulunamadı veya silme yetkiniz yok."));

        List<ProductionUnitDefinition> children = productionUnitRepository.findByParentProductionUnitId(id);
        if (!children.isEmpty()) {
            throw new IllegalStateException("Bu Grubun ('" + unitToDelete.getName() + "') altında tanımlı " + children.size() + " adet bölüm bulunmaktadır. Silmeden önce bu bölümleri silmelisiniz.");
        }

        // TODO: Bu birime bağlı üretim emri vb. var mı? Kontrolü eklenebilir.
        // boolean isUsed = ...

        productionUnitRepository.delete(unitToDelete);

        String logDetails = (unitToDelete.getParentProductionUnitId() == null ? "Üretim Grubu silindi: " : "Üretim Bölümü silindi: ") + unitToDelete.getName();
        auditLogService.logAction(currentTenantId, currentUsername, "PRODUCTION_UNIT_DELETED", logDetails);
    }
}