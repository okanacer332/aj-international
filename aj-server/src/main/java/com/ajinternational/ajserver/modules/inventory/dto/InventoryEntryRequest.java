// aj-server/src/main/java/com/ajinternational/ajserver/modules/inventory/dto/InventoryEntryRequest.java
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
public record InventoryEntryRequest(
        @NotNull LocalDate entryDate,
        @NotNull LocalTime entryTime,
        @NotBlank String operationType,
        @NotBlank String supplierId,
        @NotBlank String targetDepotId,
        String truckPlate,
        String trailerPlate,
        String driverName,
        String collectionArea, // Opsiyonel
        String weighbridgeNo,
        String waybillNo,
        String refNo1, // Arapça Fatura No
        String refNo2, // Sistem G.No
        String description,

        @Valid
        @NotEmpty
        @Size(min = 1, message = "En az bir malzeme satırı girilmelidir.")
        List<InventoryEntryLineRequest> lines
) {
    public record InventoryEntryLineRequest(
            @NotBlank String materialId,
            @NotNull Double waybillWeight, // İrsaliye
            @NotNull Double scaleWeight // Kantar
    ) {}
}