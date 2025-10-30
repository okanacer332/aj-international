package com.ajinternational.ajserver.modules.masterdata.model;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@Document(collection = "master_units")
// Bir tenant içinde Departman + Ünite adı benzersiz olmalı
@CompoundIndex(name = "tenant_dept_unit_idx", def = "{'tenantId' : 1, 'departmentName' : 1, 'unitName' : 1}", unique = true)
public class UnitDefinition {

    @Id
    private String id;

    private String tenantId;

    @NotBlank(message = "Departman adı boş olamaz")
    private String departmentName;

    @NotBlank(message = "Ünite adı boş olamaz")
    private String unitName;

    // Bu birime atanan personeller için yetkinlik takibi gerekip gerekmediğini belirtir
    private boolean isCompetencyRequired = false;

    public UnitDefinition(String tenantId, String departmentName, String unitName, boolean isCompetencyRequired) {
        this.tenantId = tenantId;
        this.departmentName = departmentName;
        this.unitName = unitName;
        this.isCompetencyRequired = isCompetencyRequired;
    }
}