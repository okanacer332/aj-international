package com.ajinternational.ajserver.modules.masterdata.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
import java.util.Optional;

@Data
@NoArgsConstructor
@Document(collection = "master_production_units")
@CompoundIndex(name = "tenant_prod_parent_name_idx", def = "{'tenantId' : 1, 'parentProductionUnitId' : 1, 'name' : 1}", unique = true)
public class ProductionUnitDefinition {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    @NotBlank(message = "Ad (Grup/Bölüm) boş olamaz")
    private String name;

    @Indexed
    private String parentProductionUnitId;

    // Redis cache serialization için ignore edilmeli
    @Transient
    @JsonIgnore
    private List<ProductionUnitDefinition> subUnits;

    public ProductionUnitDefinition(String tenantId, String name, String parentProductionUnitId) {
        this.tenantId = tenantId;
        this.name = name;
        this.parentProductionUnitId = parentProductionUnitId;
    }

    // Lombok will generate getParentProductionUnitId() returning String - correct
    // for serialization
    // Use this helper method for Optional access (not a getter pattern)
    @JsonIgnore
    public Optional<String> parentProductionUnitIdOptional() {
        return Optional.ofNullable(parentProductionUnitId);
    }
}