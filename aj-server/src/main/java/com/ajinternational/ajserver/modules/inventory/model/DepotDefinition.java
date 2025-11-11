// aj-server/src/main/java/com/ajinternational/ajserver/modules/inventory/model/DepotDefinition.java
package com.ajinternational.ajserver.modules.inventory.model;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@Document(collection = "inventory_definitions_depots")
@CompoundIndex(name = "tenant_depot_name_idx", def = "{'tenantId' : 1, 'name' : 1}", unique = true)
public class DepotDefinition {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    @NotBlank
    private String name; // Depo Adı (örn: "12 NUMARA STOK", "KARADUVAR")

    public DepotDefinition(String tenantId, String name) {
        this.tenantId = tenantId;
        this.name = name;
    }
}