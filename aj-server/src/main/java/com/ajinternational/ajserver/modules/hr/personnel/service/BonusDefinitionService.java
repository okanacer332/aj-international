package com.ajinternational.ajserver.modules.hr.personnel.service;

import com.ajinternational.ajserver.config.TenantContextHolder;
import com.ajinternational.ajserver.modules.audit.service.AuditLogService;
import com.ajinternational.ajserver.modules.hr.personnel.model.BonusDefinition;
import com.ajinternational.ajserver.modules.hr.personnel.repository.BonusDefinitionRepository;
import com.ajinternational.ajserver.modules.masterdata.model.CurrencyDefinition;
import com.ajinternational.ajserver.modules.masterdata.model.ProductionUnitDefinition;
import com.ajinternational.ajserver.modules.masterdata.repository.CurrencyDefinitionRepository;
import com.ajinternational.ajserver.modules.masterdata.repository.ProductionUnitDefinitionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BonusDefinitionService {

    private final BonusDefinitionRepository repository;
    private final ProductionUnitDefinitionRepository productionUnitRepository;
    private final CurrencyDefinitionRepository currencyRepository;
    private final AuditLogService auditLogService;

    // Helper for cache key generation
    public String getCurrentTenantIdForCache() {
        return TenantContextHolder.getCurrentTenantId();
    }

    @Cacheable(value = "bonusDefinitions", key = "#root.target.getCurrentTenantIdForCache()")
    public List<BonusDefinition> findAll() {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        List<BonusDefinition> bonuses = repository.findByTenantId(tenantId);

        // İlişkili verilerin isimlerini doldurmak için Map oluşturuyoruz (Performans
        // için toplu çekim)
        Map<String, ProductionUnitDefinition> unitMap = productionUnitRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(ProductionUnitDefinition::getId, Function.identity()));

        Map<String, String> currencyMap = currencyRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(CurrencyDefinition::getId, CurrencyDefinition::getCode));

        // Transient alanları doldur
        for (BonusDefinition b : bonuses) {
            if (b.getProductionGroupId() != null && unitMap.containsKey(b.getProductionGroupId())) {
                b.setGroupName(unitMap.get(b.getProductionGroupId()).getName());
            }
            if (b.getProductionSectionId() != null && unitMap.containsKey(b.getProductionSectionId())) {
                b.setSectionName(unitMap.get(b.getProductionSectionId()).getName());
            }
            if (b.getCurrencyId() != null) {
                b.setCurrencyCode(currencyMap.getOrDefault(b.getCurrencyId(), "N/A"));
            }
        }

        return bonuses;
    }

    @CacheEvict(value = "bonusDefinitions", key = "#root.target.getCurrentTenantIdForCache()")
    public BonusDefinition save(BonusDefinition definition) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        String username = TenantContextHolder.getCurrentUsername();

        if (definition.getId() == null) {
            definition.setTenantId(tenantId);
            auditLogService.logAction(tenantId, username, "BONUS_DEF_CREATED",
                    "Yeni prim tanımı: " + definition.getName());
        } else {
            // Güncelleme güvenliği: Var olan kaydın tenantId'sini koru
            BonusDefinition existing = repository.findById(definition.getId())
                    .orElseThrow(() -> new RuntimeException("Kayıt bulunamadı."));
            definition.setTenantId(existing.getTenantId());
            auditLogService.logAction(tenantId, username, "BONUS_DEF_UPDATED",
                    "Prim güncellendi: " + definition.getName());
        }

        return repository.save(definition);
    }

    @CacheEvict(value = "bonusDefinitions", key = "#root.target.getCurrentTenantIdForCache()")
    public void delete(String id) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        repository.deleteById(id);
        auditLogService.logAction(tenantId, TenantContextHolder.getCurrentUsername(), "BONUS_DEF_DELETED",
                "Prim silindi ID: " + id);
    }
}