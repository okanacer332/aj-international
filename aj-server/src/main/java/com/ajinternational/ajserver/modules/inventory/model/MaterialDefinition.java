// aj-server/src/main/java/com/ajinternational/ajserver/modules/inventory/model/MaterialDefinition.java
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
@Document(collection = "inventory_definitions_materials")
@CompoundIndex(name = "tenant_material_code_idx", def = "{'tenantId' : 1, 'code' : 1}", unique = true)
public class MaterialDefinition {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    @NotBlank
    private String name; // Malzeme Adı (Sayfa5/Sayfa6)

    private String code; // Malzeme Kodu (Varsa)

    private String description;

    public MaterialDefinition(String tenantId, String name, String code) {
        this.tenantId = tenantId;
        this.name = name;
        this.code = code;
    }
}