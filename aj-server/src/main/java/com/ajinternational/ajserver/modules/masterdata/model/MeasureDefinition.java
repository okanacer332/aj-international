package com.ajinternational.ajserver.modules.masterdata.model;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@Document(collection = "master_measures")
// Bir tenant içinde Ölçü Birimi Adı benzersiz olmalı
@CompoundIndex(name = "tenant_measure_name_idx", def = "{'tenantId' : 1, 'name' : 1}", unique = true)
public class MeasureDefinition {

    @Id
    private String id;

    private String tenantId;

    @NotBlank(message = "Ölçü birimi adı boş olamaz")
    private String name; // Örn: "kg", "Tonaj", "Balya"

    public MeasureDefinition(String tenantId, String name) {
        this.tenantId = tenantId;
        this.name = name;
    }
}