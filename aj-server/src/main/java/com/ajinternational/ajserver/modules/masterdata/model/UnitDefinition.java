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
@Document(collection = "master_units")
@CompoundIndex(name = "tenant_parent_name_idx", def = "{'tenantId' : 1, 'parentUnitId' : 1, 'name' : 1}", unique = true)
public class UnitDefinition {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    @NotBlank(message = "Ad (Departman/Ünite) boş olamaz")
    private String name;

    @Indexed
    private String parentUnitId;

    private boolean competencyRequired = false;

    // Redis cache serialization için ignore edilmeli
    @Transient
    @JsonIgnore
    private List<UnitDefinition> subUnits;

    public UnitDefinition(String tenantId, String name, String parentUnitId, boolean competencyRequired) {
        this.tenantId = tenantId;
        this.name = name;
        this.parentUnitId = parentUnitId;
        this.competencyRequired = competencyRequired;
    }

    // Lombok will generate getParentUnitId() returning String - correct for
    // serialization
    // Use this helper method for Optional access (not a getter pattern)
    @JsonIgnore
    public Optional<String> parentUnitIdOptional() {
        return Optional.ofNullable(parentUnitId);
    }
}