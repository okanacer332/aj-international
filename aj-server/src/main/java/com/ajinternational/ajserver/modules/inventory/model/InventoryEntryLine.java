// aj-server/src/main/java/com/ajinternational/ajserver/modules/inventory/model/InventoryEntryLine.java
package com.ajinternational.ajserver.modules.inventory.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.index.Indexed;

@Data
@NoArgsConstructor
public class InventoryEntryLine {

    @NotBlank
    @Indexed
    private String materialId; // MaterialDefinition ID

    @NotNull
    private Double waybillWeight; // İrsaliye Tonaj

    @NotNull
    private Double scaleWeight; // Kantar Tonaj (TONAJ)

    @NotNull
    private Double differenceKg; // Fark (KG) - Otomatik hesaplanacak
}