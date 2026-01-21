package com.ajinternational.ajserver.modules.masterdata.service;

import com.ajinternational.ajserver.config.TenantContextHolder;
import com.ajinternational.ajserver.modules.audit.service.AuditLogService;
import com.ajinternational.ajserver.modules.masterdata.model.CurrencyDefinition;
import com.ajinternational.ajserver.modules.masterdata.repository.CurrencyDefinitionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CurrencyDefinitionService {

    private final CurrencyDefinitionRepository currencyRepository;
    private final AuditLogService auditLogService;

    // Helper for cache key generation
    public String getCurrentTenantIdForCache() {
        return TenantContextHolder.getCurrentTenantId();
    }

    @Cacheable(value = "currencies", key = "#root.target.getCurrentTenantIdForCache()")
    public List<CurrencyDefinition> findAllCurrencies() {
        UserDetails userDetails = TenantContextHolder.getCurrentUserDetails();
        String tenantId = TenantContextHolder.getCurrentTenantId();
        boolean isSuperAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (isSuperAdmin) {
            return currencyRepository.findAll();
        } else {
            return currencyRepository.findByTenantId(tenantId);
        }
    }

    public Optional<CurrencyDefinition> findById(String id) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        return currencyRepository.findByTenantIdAndId(tenantId, id);
    }

    @CacheEvict(value = "currencies", key = "#root.target.getCurrentTenantIdForCache()")
    public CurrencyDefinition saveCurrency(CurrencyDefinition currencyFromRequest) {
        String currentTenantId = TenantContextHolder.getCurrentTenantId();
        String currentUsername = TenantContextHolder.getCurrentUsername();

        // Benzersizlik kontrolü
        currencyRepository.findByTenantIdAndCode(currentTenantId, currencyFromRequest.getCode())
                .ifPresent(existing -> {
                    if (currencyFromRequest.getId() == null || !existing.getId().equals(currencyFromRequest.getId())) {
                        throw new IllegalArgumentException("Bu para birimi kodu zaten kayıtlı.");
                    }
                });

        String logAction;
        String logDetails;
        CurrencyDefinition currencyToSave;

        if (currencyFromRequest.getId() == null) {
            currencyToSave = currencyFromRequest;
            currencyToSave.setTenantId(currentTenantId);
            logAction = "CURRENCY_DEFINITION_CREATED";
            logDetails = "Yeni para birimi oluşturuldu: " + currencyToSave.getCode();
        } else {
            currencyToSave = findById(currencyFromRequest.getId())
                    .orElseThrow(() -> new RuntimeException("Para birimi bulunamadı veya yetkiniz yok."));

            currencyToSave.setName(currencyFromRequest.getName());
            currencyToSave.setCode(currencyFromRequest.getCode());

            logAction = "CURRENCY_DEFINITION_UPDATED";
            logDetails = "Para birimi güncellendi: " + currencyToSave.getCode();
        }

        CurrencyDefinition savedCurrency = currencyRepository.save(currencyToSave);
        auditLogService.logAction(currentTenantId, currentUsername, logAction, logDetails);
        return savedCurrency;
    }

    @CacheEvict(value = "currencies", key = "#root.target.getCurrentTenantIdForCache()")
    public void deleteCurrency(String id) {
        String currentTenantId = TenantContextHolder.getCurrentTenantId();
        String currentUsername = TenantContextHolder.getCurrentUsername();

        CurrencyDefinition currencyToDelete = findById(id)
                .orElseThrow(() -> new RuntimeException("Para birimi bulunamadı veya silme yetkiniz yok."));

        currencyRepository.delete(currencyToDelete);

        String logDetails = "Para birimi silindi: " + currencyToDelete.getCode();
        auditLogService.logAction(currentTenantId, currentUsername, "CURRENCY_DEFINITION_DELETED", logDetails);
    }
}