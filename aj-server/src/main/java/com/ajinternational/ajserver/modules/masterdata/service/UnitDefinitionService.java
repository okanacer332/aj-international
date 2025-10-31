package com.ajinternational.ajserver.modules.masterdata.service;

import com.ajinternational.ajserver.config.TenantContextHolder;
import com.ajinternational.ajserver.modules.audit.service.AuditLogService;
import com.ajinternational.ajserver.modules.hr.personnel.repository.PersonnelRepository; // Personel bağımlılığı eklendi
import com.ajinternational.ajserver.modules.masterdata.model.UnitDefinition;
import com.ajinternational.ajserver.modules.masterdata.repository.UnitDefinitionRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UnitDefinitionService {

    private static final Logger logger = LoggerFactory.getLogger(UnitDefinitionService.class);

    private final UnitDefinitionRepository unitRepository;
    private final AuditLogService auditLogService;
    private final PersonnelRepository personnelRepository; // Bağımlılık kontrolü için eklendi

    /**
     * Hiyerarşik olarak tüm birimleri (Departmanlar ve altındaki üniteler) döndürür.
     */
    public List<UnitDefinition> findAllUnits() {
        UserDetails userDetails = TenantContextHolder.getCurrentUserDetails();
        String tenantId = TenantContextHolder.getCurrentTenantId();
        boolean isSuperAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        List<UnitDefinition> allUnits;
        if (isSuperAdmin) {
            allUnits = unitRepository.findAll();
            logger.info("Süper Admin için tüm tenant'lardaki birimler çekildi: {} adet.", allUnits.size());
        } else {
            allUnits = unitRepository.findByTenantId(tenantId);
            logger.info("Tenant '{}' için tüm birimler çekildi: {} adet.", tenantId, allUnits.size());
        }

        // Hiyerarşiyi kur
        Map<String, UnitDefinition> unitMap = new HashMap<>();
        for (UnitDefinition unit : allUnits) {
            unit.setSubUnits(new ArrayList<>());
            unitMap.put(unit.getId(), unit);
        }

        List<UnitDefinition> rootUnits = new ArrayList<>();
        for (UnitDefinition unit : allUnits) {
            Optional<String> parentIdOpt = unit.getParentUnitId().filter(s -> !s.trim().isEmpty());
            if (parentIdOpt.isPresent()) {
                UnitDefinition parent = unitMap.get(parentIdOpt.get());
                if (parent != null) {
                    parent.getSubUnits().add(unit);
                } else {
                    logger.warn("Alt birim '{}' ({}) için ana birim ID'si '{}' bulundu ancak ilgili ana birim map'te bulunamadı!", unit.getName(), unit.getId(), parentIdOpt.get());
                }
            } else {
                rootUnits.add(unit);
            }
        }
        logger.info("Birim hiyerarşisi kuruldu. Kök departman sayısı: {}", rootUnits.size());
        return rootUnits;
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
    public UnitDefinition saveUnit(UnitDefinition unitFromRequest) {
        String currentTenantId = TenantContextHolder.getCurrentTenantId();
        String currentUsername = TenantContextHolder.getCurrentUsername();

        // Gelen 'parentUnitId' değerini temizle (boş string, "null" string vs. yerine 'null' object kullan)
        String rawParentId = unitFromRequest.getParentUnitId().orElse(null);
        String finalParentId = (rawParentId != null && !rawParentId.trim().isEmpty() && !rawParentId.equals("null")) ? rawParentId.trim() : null;
        unitFromRequest.setParentUnitId(finalParentId);

        // Benzersizlik kontrolü (Aynı ebeveyn altında aynı isim olamaz)
        unitRepository.findByTenantIdAndParentUnitIdAndName(currentTenantId, finalParentId, unitFromRequest.getName())
                .ifPresent(existing -> {
                    if (unitFromRequest.getId() == null || !existing.getId().equals(unitFromRequest.getId())) {
                        throw new IllegalArgumentException("Bu Departman/Ünite adı bu seviyede zaten kayıtlı.");
                    }
                });

        String logAction;
        String logDetails;
        UnitDefinition unitToSave;

        if (unitFromRequest.getId() == null) {
            // Yeni kayıt
            unitToSave = unitFromRequest;
            unitToSave.setTenantId(currentTenantId);
            logAction = "UNIT_DEFINITION_CREATED";
            logDetails = (finalParentId == null ? "Yeni Departman: " : "Yeni Ünite: ") + unitToSave.getName();
        } else {
            // Güncelleme
            unitToSave = findById(unitFromRequest.getId())
                    .orElseThrow(() -> new RuntimeException("Birim bulunamadı veya yetkiniz yok."));

            // Sadece bu alanların güncellenmesine izin ver
            unitToSave.setName(unitFromRequest.getName());
            unitToSave.setParentUnitId(finalParentId);
            unitToSave.setCompetencyRequired(unitFromRequest.isCompetencyRequired());

            logAction = "UNIT_DEFINITION_UPDATED";
            logDetails = "Birim güncellendi: " + unitToSave.getName();
        }

        UnitDefinition savedUnit = unitRepository.save(unitToSave);
        auditLogService.logAction(currentTenantId, currentUsername, logAction, logDetails);
        return savedUnit;
    }

    // Silme
    public void deleteUnit(String id) {
        String currentTenantId = TenantContextHolder.getCurrentTenantId();
        String currentUsername = TenantContextHolder.getCurrentUsername();

        UnitDefinition unitToDelete = findById(id)
                .orElseThrow(() -> new RuntimeException("Birim bulunamadı veya silme yetkiniz yok."));

        // 1. Güvenlik Kontrolü: Alt birimleri var mı?
        List<UnitDefinition> children = unitRepository.findByParentUnitId(id);
        if (!children.isEmpty()) {
            throw new IllegalStateException("Bu departmanın (" + unitToDelete.getName() + ") altında tanımlı " + children.size() + " adet ünite bulunmaktadır. Silmeden önce bu üniteleri silmelisiniz.");
        }

        // 2. Güvenlik Kontrolü: Bu birime atanmış personel var mı?
        // (PersonelRepository'de bu metodu eklemeliyiz)
        // Yorum: Şimdilik bu metot (existsByUnitDefinitionId) PersonnelRepository'de yok, ama eklenmeli.
        // Ekleme varsayımıyla devam ediyorum:
        /*
        if (personnelRepository.existsByTenantIdAndUnitDefinitionId(currentTenantId, id)) {
             throw new IllegalStateException("Bu birime ("+ unitToDelete.getName() +") atanmış personel bulunmaktadır. Silme işlemi yapılamaz.");
        }
        */

        // Şimdilik (yukarıdaki metot eklenene kadar) manuel kontrol edelim:
        boolean personnelExists = personnelRepository.findByTenantId(currentTenantId).stream()
                .anyMatch(p -> Objects.equals(p.getUnitDefinitionId(), id));
        if(personnelExists) {
            throw new IllegalStateException("Bu birime ("+ unitToDelete.getName() +") atanmış personel bulunmaktadır. Silme işlemi yapılamaz.");
        }


        unitRepository.delete(unitToDelete);

        String logDetails = (unitToDelete.getParentUnitId() == null ? "Departman silindi: " : "Ünite silindi: ") + unitToDelete.getName();
        auditLogService.logAction(currentTenantId, currentUsername, "UNIT_DEFINITION_DELETED", logDetails);
    }
}