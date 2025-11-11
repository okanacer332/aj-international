// aj-server/src/main/java/com/ajinternational/ajserver/modules/inventory/model/InventoryDispatchLine.java
package com.ajinternational.ajserver.modules.inventory.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.index.Indexed;

@Data
@NoArgsConstructor
public class InventoryDispatchLine {

    @NotBlank
    @Indexed
    private String materialId; // MaterialDefinition ID

    @NotNull
    private Double weightTon; // TONAJ
}