// aj-server/src/main/java/com/ajinternational/ajserver/modules/inventory/dto/InventoryDispatchRequest.java
package com.ajinternational.ajserver.modules.inventory.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

// Bu DTO, Frontend'den veri GİRİŞİ (POST/PUT) için kullanılır
public record InventoryDispatchRequest(
        @NotNull LocalDate dispatchDate,
        @NotNull LocalTime dispatchTime,
        @NotBlank String customerId,
        @NotBlank String dispatchDepotId,
        String truckPlate,
        String trailerPlate,
        String weighbridgeNo,
        String containerNo,
        String waybillNo,
        String invoiceNo,
        String arabicInvoiceNo,
        Double refAmount,

        @Valid
        @NotEmpty
        @Size(min = 1, message = "En az bir malzeme satırı girilmelidir.")
        List<InventoryDispatchLineRequest> lines
) {
    public record InventoryDispatchLineRequest(
            @NotBlank String materialId,
            @NotNull Double weightKg // GÜNCELLENDİ (weightTon -> weightKg)
    ) {}
}