// aj-server/src/main/java/com/ajinternational/ajserver/modules/inventory/service/InventoryDispatchService.java
package com.ajinternational.ajserver.modules.inventory.service;

import com.ajinternational.ajserver.config.TenantContextHolder;
import com.ajinternational.ajserver.modules.audit.service.AuditLogService;
import com.ajinternational.ajserver.modules.inventory.dto.InventoryDispatchRequest;
import com.ajinternational.ajserver.modules.inventory.dto.InventoryDispatchResponse;
import com.ajinternational.ajserver.modules.inventory.model.*;
import com.ajinternational.ajserver.modules.inventory.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryDispatchService {

    private final InventoryDispatchRepository dispatchRepository;
    private final MaterialDefinitionRepository materialRepository;
    private final DepotDefinitionRepository depotRepository;
    private final CustomerDefinitionRepository customerRepository;
    private final AuditLogService auditLogService;

    // Helper: Super Admin kontrolü
    private boolean isSuperAdmin() {
        UserDetails userDetails = TenantContextHolder.getCurrentUserDetails();
        return userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }

    // Helper: Tenant-güvenli ID ile bulma
    private Optional<InventoryDispatch> findById(String id) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        if (isSuperAdmin()) {
            return dispatchRepository.findById(id);
        } else {
            return dispatchRepository.findByTenantIdAndId(tenantId, id);
        }
    }

    // Hepsini Zenginleştirilmiş DTO olarak listele
    public List<InventoryDispatchResponse> findAllDispatches() {
        String tenantId = TenantContextHolder.getCurrentTenantId();

        List<InventoryDispatch> dispatches = isSuperAdmin() ? dispatchRepository.findAll() : dispatchRepository.findByTenantId(tenantId);

        // İlişkili tanımlamaları tek seferde çek (Performans için)
        Map<String, String> customerMap = customerRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(CustomerDefinition::getId, CustomerDefinition::getName));
        Map<String, String> depotMap = depotRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(DepotDefinition::getId, DepotDefinition::getName));
        Map<String, String> materialMap = materialRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(MaterialDefinition::getId, MaterialDefinition::getName));

        // DTO'ya dönüştür
        return dispatches.stream()
                .map(dispatch -> {
                    List<InventoryDispatchResponse.InventoryDispatchLineResponse> lineResponses = dispatch.getLines().stream()
                            .map(line -> {
                                InventoryDispatchResponse.InventoryDispatchLineResponse lineDto = new InventoryDispatchResponse.InventoryDispatchLineResponse();
                                lineDto.setMaterialId(line.getMaterialId());
                                lineDto.setMaterialName(materialMap.getOrDefault(line.getMaterialId(), "Bilinmeyen Malzeme"));
                                lineDto.setWeightKg(line.getWeightKg()); // GÜNCELLENDİ (getWeightTon -> getWeightKg)
                                return lineDto;
                            }).collect(Collectors.toList());

                    return InventoryDispatchResponse.fromEntity(
                            dispatch,
                            customerMap.getOrDefault(dispatch.getCustomerId(), "Bilinmeyen Müşteri"),
                            depotMap.getOrDefault(dispatch.getDispatchDepotId(), "Bilinmeyen Depo"),
                            lineResponses
                    );
                })
                .collect(Collectors.toList());
    }

    // Yeni Sevk Fişi Oluştur
    @Transactional
    public InventoryDispatch createDispatch(InventoryDispatchRequest request) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        String username = TenantContextHolder.getCurrentUsername();

        InventoryDispatch dispatch = new InventoryDispatch();
        dispatch.setTenantId(tenantId);
        mapRequestToEntity(request, dispatch);

        InventoryDispatch savedDispatch = dispatchRepository.save(dispatch);
        auditLogService.logAction(tenantId, username, "INVENTORY_DISPATCH_CREATED", "Yeni sevk fişi oluşturuldu: " + savedDispatch.getId());
        return savedDispatch;
    }

    // Sevk Fişi Güncelle
    @Transactional
    public InventoryDispatch updateDispatch(String id, InventoryDispatchRequest request) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        String username = TenantContextHolder.getCurrentUsername();

        InventoryDispatch existingDispatch = findById(id)
                .orElseThrow(() -> new RuntimeException("Sevk fişi bulunamadı veya yetkiniz yok."));

        mapRequestToEntity(request, existingDispatch);

        InventoryDispatch updatedDispatch = dispatchRepository.save(existingDispatch);
        auditLogService.logAction(tenantId, username, "INVENTORY_DISPATCH_UPDATED", "Sevk fişi güncellendi: " + updatedDispatch.getId());
        return updatedDispatch;
    }

    // Sevk Fişi Sil
    @Transactional
    public void deleteDispatch(String id) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        String username = TenantContextHolder.getCurrentUsername();

        InventoryDispatch dispatch = findById(id)
                .orElseThrow(() -> new RuntimeException("Sevk fişi bulunamadı veya silme yetkiniz yok."));

        // TODO: Silme işlemi stokları etkiler mi? (İş mantığına göre eklenecek)

        dispatchRepository.delete(dispatch);
        auditLogService.logAction(tenantId, username, "INVENTORY_DISPATCH_DELETED", "Sevk fişi silindi: " + id);
    }

    // Helper: DTO'dan Entity'ye Eşleştirme
    private void mapRequestToEntity(InventoryDispatchRequest request, InventoryDispatch dispatch) {
        dispatch.setDispatchDate(request.dispatchDate());
        dispatch.setDispatchTime(request.dispatchTime());
        dispatch.setCustomerId(request.customerId());
        dispatch.setDispatchDepotId(request.dispatchDepotId());
        dispatch.setTruckPlate(request.truckPlate());
        dispatch.setTrailerPlate(request.trailerPlate());
        dispatch.setWeighbridgeNo(request.weighbridgeNo());
        dispatch.setContainerNo(request.containerNo());
        dispatch.setWaybillNo(request.waybillNo());
        dispatch.setInvoiceNo(request.invoiceNo());
        dispatch.setArabicInvoiceNo(request.arabicInvoiceNo());
        dispatch.setRefAmount(request.refAmount());

        List<InventoryDispatchLine> lines = request.lines().stream()
                .map(lineDto -> {
                    InventoryDispatchLine line = new InventoryDispatchLine();
                    line.setMaterialId(lineDto.materialId());
                    line.setWeightKg(lineDto.weightKg()); // GÜNCELLENDİ (setWeightTon -> setWeightKg)
                    return line;
                }).collect(Collectors.toList());
        dispatch.setLines(lines);
    }
}