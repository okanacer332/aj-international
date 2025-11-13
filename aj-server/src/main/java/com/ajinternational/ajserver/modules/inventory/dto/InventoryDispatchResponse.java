// aj-server/src/main/java/com/ajinternational/ajserver/modules/inventory/dto/InventoryDispatchResponse.java
package com.ajinternational.ajserver.modules.inventory.dto;

import com.ajinternational.ajserver.modules.inventory.model.InventoryDispatch;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

// Bu DTO, Frontend'e veri GÖNDERMEK (GET) için kullanılır (Zenginleştirilmiş Veri)
@Data
@NoArgsConstructor
public class InventoryDispatchResponse {

    // Modelden Gelen Ana Alanlar
    private String id;
    private String tenantId;
    private LocalDate dispatchDate;
    private LocalTime dispatchTime;
    private String truckPlate;
    private String trailerPlate;
    private String weighbridgeNo;
    private String containerNo;
    private String waybillNo;
    private String invoiceNo;
    private String arabicInvoiceNo;
    private Double refAmount;

    // Join Edilmiş (Zenginleştirilmiş) Alanlar
    private String customerId;
    private String customerName;
    private String dispatchDepotId;
    private String dispatchDepotName;

    private List<InventoryDispatchLineResponse> lines;

    // Satır DTO'su
    @Data
    @NoArgsConstructor
    public static class InventoryDispatchLineResponse {
        private String materialId;
        private String materialName;
        private Double weightKg; // GÜNCELLENDİ (weightTon -> weightKg)
    }

    // Mapper Metodu
    public static InventoryDispatchResponse fromEntity(InventoryDispatch dispatch, String customerName, String depotName, List<InventoryDispatchLineResponse> lineResponses) {
        InventoryDispatchResponse dto = new InventoryDispatchResponse();
        dto.setId(dispatch.getId());
        dto.setTenantId(dispatch.getTenantId());
        dto.setDispatchDate(dispatch.getDispatchDate());
        dto.setDispatchTime(dispatch.getDispatchTime());
        dto.setTruckPlate(dispatch.getTruckPlate());
        dto.setTrailerPlate(dispatch.getTrailerPlate());
        dto.setWeighbridgeNo(dispatch.getWeighbridgeNo());
        dto.setContainerNo(dispatch.getContainerNo());
        dto.setWaybillNo(dispatch.getWaybillNo());
        dto.setInvoiceNo(dispatch.getInvoiceNo());
        dto.setArabicInvoiceNo(dispatch.getArabicInvoiceNo());
        dto.setRefAmount(dispatch.getRefAmount());

        // Zenginleştirilmiş
        dto.setCustomerId(dispatch.getCustomerId());
        dto.setCustomerName(customerName);
        dto.setDispatchDepotId(dispatch.getDispatchDepotId());
        dto.setDispatchDepotName(depotName);

        dto.setLines(lineResponses);
        return dto;
    }
}