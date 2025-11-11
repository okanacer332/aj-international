// aj-server/src/main/java/com/ajinternational/ajserver/modules/inventory/dto/InventoryEntryResponse.java
package com.ajinternational.ajserver.modules.inventory.dto;

import com.ajinternational.ajserver.modules.inventory.model.InventoryEntry;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

// Bu DTO, Frontend'e veri GÖNDERMEK (GET) için kullanılır (Zenginleştirilmiş Veri)
@Data
@NoArgsConstructor
public class InventoryEntryResponse {

    // Modelden Gelen Ana Alanlar
    private String id;
    private String tenantId;
    private LocalDate entryDate;
    private LocalTime entryTime;
    private String operationType;
    private String truckPlate;
    private String trailerPlate;
    private String driverName;
    private String collectionArea;
    private String weighbridgeNo;
    private String waybillNo;
    private String refNo1;
    private String refNo2;
    private String description;

    // Join Edilmiş (Zenginleştirilmiş) Alanlar
    private String supplierId;
    private String supplierName;
    private String targetDepotId;
    private String targetDepotName;

    private List<InventoryEntryLineResponse> lines;

    // Satır DTO'su
    @Data
    @NoArgsConstructor
    public static class InventoryEntryLineResponse {
        private String materialId;
        private String materialName;
        private Double waybillWeight;
        private Double scaleWeight;
        private Double differenceKg;
    }

    // Bu, Servis katmanında kullanılacak olan bir "Mapper" metodudur
    public static InventoryEntryResponse fromEntity(InventoryEntry entry, String supplierName, String depotName, List<InventoryEntryLineResponse> lineResponses) {
        InventoryEntryResponse dto = new InventoryEntryResponse();
        dto.setId(entry.getId());
        dto.setTenantId(entry.getTenantId());
        dto.setEntryDate(entry.getEntryDate());
        dto.setEntryTime(entry.getEntryTime());
        dto.setOperationType(entry.getOperationType());
        dto.setTruckPlate(entry.getTruckPlate());
        dto.setTrailerPlate(entry.getTrailerPlate());
        dto.setDriverName(entry.getDriverName());
        dto.setCollectionArea(entry.getCollectionArea());
        dto.setWeighbridgeNo(entry.getWeighbridgeNo());
        dto.setWaybillNo(entry.getWaybillNo());
        dto.setRefNo1(entry.getRefNo1());
        dto.setRefNo2(entry.getRefNo2());
        dto.setDescription(entry.getDescription());

        // Zenginleştirilmiş alanlar
        dto.setSupplierId(entry.getSupplierId());
        dto.setSupplierName(supplierName);
        dto.setTargetDepotId(entry.getTargetDepotId());
        dto.setTargetDepotName(depotName);

        dto.setLines(lineResponses);

        return dto;
    }
}