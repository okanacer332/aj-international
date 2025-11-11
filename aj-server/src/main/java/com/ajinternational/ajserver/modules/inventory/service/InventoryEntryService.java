// aj-server/src/main/java/com/ajinternational/ajserver/modules/inventory/service/InventoryEntryService.java
package com.ajinternational.ajserver.modules.inventory.service;

import com.ajinternational.ajserver.config.TenantContextHolder;
import com.ajinternational.ajserver.modules.audit.service.AuditLogService;
import com.ajinternational.ajserver.modules.inventory.dto.InventoryEntryRequest;
import com.ajinternational.ajserver.modules.inventory.dto.InventoryEntryResponse;
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
public class InventoryEntryService {

    private final InventoryEntryRepository entryRepository;
    private final MaterialDefinitionRepository materialRepository;
    private final DepotDefinitionRepository depotRepository;
    private final SupplierDefinitionRepository supplierRepository;
    private final AuditLogService auditLogService;

    // Helper: Super Admin kontrolü
    private boolean isSuperAdmin() {
        UserDetails userDetails = TenantContextHolder.getCurrentUserDetails();
        return userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }

    // Helper: Tenant-güvenli ID ile bulma
    private Optional<InventoryEntry> findById(String id) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        if (isSuperAdmin()) {
            return entryRepository.findById(id);
        } else {
            return entryRepository.findByTenantIdAndId(tenantId, id);
        }
    }

    // Hepsini Zenginleştirilmiş DTO olarak listele
    public List<InventoryEntryResponse> findAllEntries() {
        String tenantId = TenantContextHolder.getCurrentTenantId();

        List<InventoryEntry> entries = isSuperAdmin() ? entryRepository.findAll() : entryRepository.findByTenantId(tenantId);

        // İlişkili tanımlamaları tek seferde çek (Performans için)
        Map<String, String> supplierMap = supplierRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(SupplierDefinition::getId, SupplierDefinition::getName));
        Map<String, String> depotMap = depotRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(DepotDefinition::getId, DepotDefinition::getName));
        Map<String, String> materialMap = materialRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(MaterialDefinition::getId, MaterialDefinition::getName));

        // DTO'ya dönüştür
        return entries.stream()
                .map(entry -> {
                    List<InventoryEntryResponse.InventoryEntryLineResponse> lineResponses = entry.getLines().stream()
                            .map(line -> {
                                InventoryEntryResponse.InventoryEntryLineResponse lineDto = new InventoryEntryResponse.InventoryEntryLineResponse();
                                lineDto.setMaterialId(line.getMaterialId());
                                lineDto.setMaterialName(materialMap.getOrDefault(line.getMaterialId(), "Bilinmeyen Malzeme"));
                                lineDto.setWaybillWeight(line.getWaybillWeight());
                                lineDto.setScaleWeight(line.getScaleWeight());
                                lineDto.setDifferenceKg(line.getDifferenceKg());
                                return lineDto;
                            }).collect(Collectors.toList());

                    return InventoryEntryResponse.fromEntity(
                            entry,
                            supplierMap.getOrDefault(entry.getSupplierId(), "Bilinmeyen Tedarikçi"),
                            depotMap.getOrDefault(entry.getTargetDepotId(), "Bilinmeyen Depo"),
                            lineResponses
                    );
                })
                .collect(Collectors.toList());
    }

    // Yeni Giriş Fişi Oluştur
    @Transactional
    public InventoryEntry createEntry(InventoryEntryRequest request) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        String username = TenantContextHolder.getCurrentUsername();

        InventoryEntry entry = new InventoryEntry();
        entry.setTenantId(tenantId);
        mapRequestToEntity(request, entry);

        InventoryEntry savedEntry = entryRepository.save(entry);
        auditLogService.logAction(tenantId, username, "INVENTORY_ENTRY_CREATED", "Yeni giriş fişi oluşturuldu: " + savedEntry.getId());
        return savedEntry;
    }

    // Giriş Fişi Güncelle
    @Transactional
    public InventoryEntry updateEntry(String id, InventoryEntryRequest request) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        String username = TenantContextHolder.getCurrentUsername();

        InventoryEntry existingEntry = findById(id)
                .orElseThrow(() -> new RuntimeException("Giriş fişi bulunamadı veya yetkiniz yok."));

        mapRequestToEntity(request, existingEntry);

        InventoryEntry updatedEntry = entryRepository.save(existingEntry);
        auditLogService.logAction(tenantId, username, "INVENTORY_ENTRY_UPDATED", "Giriş fişi güncellendi: " + updatedEntry.getId());
        return updatedEntry;
    }

    // Giriş Fişi Sil
    @Transactional
    public void deleteEntry(String id) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        String username = TenantContextHolder.getCurrentUsername();

        InventoryEntry entry = findById(id)
                .orElseThrow(() -> new RuntimeException("Giriş fişi bulunamadı veya silme yetkiniz yok."));

        // TODO: Silme işlemi stokları etkiler mi? (İş mantığına göre eklenecek)
        // Mevcut plana göre stok, giriş ve çıkışların toplamıdır, bu yüzden silmek stoğu etkilemeli.

        entryRepository.delete(entry);
        auditLogService.logAction(tenantId, username, "INVENTORY_ENTRY_DELETED", "Giriş fişi silindi: " + id);
    }

    // Helper: DTO'dan Entity'ye Eşleştirme
    private void mapRequestToEntity(InventoryEntryRequest request, InventoryEntry entry) {
        entry.setEntryDate(request.entryDate());
        entry.setEntryTime(request.entryTime());
        entry.setOperationType(request.operationType());
        entry.setSupplierId(request.supplierId());
        entry.setTargetDepotId(request.targetDepotId());
        entry.setTruckPlate(request.truckPlate());
        entry.setTrailerPlate(request.trailerPlate());
        entry.setDriverName(request.driverName());
        entry.setCollectionArea(request.collectionArea());
        entry.setWeighbridgeNo(request.weighbridgeNo());
        entry.setWaybillNo(request.waybillNo());
        entry.setRefNo1(request.refNo1());
        entry.setRefNo2(request.refNo2());
        entry.setDescription(request.description());

        List<InventoryEntryLine> lines = request.lines().stream()
                .map(lineDto -> {
                    InventoryEntryLine line = new InventoryEntryLine();
                    line.setMaterialId(lineDto.materialId());
                    line.setWaybillWeight(lineDto.waybillWeight());
                    line.setScaleWeight(lineDto.scaleWeight());
                    // Farkı KG olarak hesapla (Ton * 1000)
                    double diffKg = (lineDto.scaleWeight() - lineDto.waybillWeight()) * 1000;
                    line.setDifferenceKg(diffKg);
                    return line;
                }).collect(Collectors.toList());
        entry.setLines(lines);
    }
}