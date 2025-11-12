package com.ajinternational.ajserver.modules.masterdata.model;

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
@Document(collection = "master_production_units") // Yeni koleksiyon adı
// Bir tenant içinde, aynı ebeveyn (Grup) altında aynı isimde Bölüm olamaz
@CompoundIndex(name = "tenant_prod_parent_name_idx", def = "{'tenantId' : 1, 'parentProductionUnitId' : 1, 'name' : 1}", unique = true)
public class ProductionUnitDefinition {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    @NotBlank(message = "Ad (Grup/Bölüm) boş olamaz")
    private String name; // Örn: "Baby" (Grup) veya "Kalite" (Bölüm)

    @Indexed
    private String parentProductionUnitId; // Bu null ise "Grup", doluysa "Bölüm"dür.

    // Bu alan veritabanına kaydedilmez, hiyerarşiyi göstermek için kullanılır
    @Transient
    private List<ProductionUnitDefinition> subUnits; // Alt Bölümler (Grup ise)

    public ProductionUnitDefinition(String tenantId, String name, String parentProductionUnitId) {
        this.tenantId = tenantId;
        this.name = name;
        this.parentProductionUnitId = parentProductionUnitId;
    }

    public Optional<String> getParentProductionUnitId() {
        return Optional.ofNullable(parentProductionUnitId);
    }
}