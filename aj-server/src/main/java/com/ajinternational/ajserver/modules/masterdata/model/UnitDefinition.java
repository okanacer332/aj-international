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
@Document(collection = "master_units")
// Bir tenant içinde, aynı ebeveyn altında aynı isimde birim/departman olamaz
@CompoundIndex(name = "tenant_parent_name_idx", def = "{'tenantId' : 1, 'parentUnitId' : 1, 'name' : 1}", unique = true)
public class UnitDefinition {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    @NotBlank(message = "Ad (Departman/Ünite) boş olamaz")
    private String name; // YENİ (departmentName ve unitName yerine)

    @Indexed
    private String parentUnitId; // YENİ (Bu null ise Departman'dır)

    // Bu alan frontend'deki DTO ile eşleşmesi için 'is' ön eki olmadan kullanıldı
    private boolean competencyRequired = false;

    // Bu alan veritabanına kaydedilmez, hiyerarşiyi göstermek için kullanılır
    @Transient
    private List<UnitDefinition> subUnits;

    // Eski departmentName ve unitName alanları kaldırıldı

    public UnitDefinition(String tenantId, String name, String parentUnitId, boolean competencyRequired) {
        this.tenantId = tenantId;
        this.name = name;
        this.parentUnitId = parentUnitId;
        this.competencyRequired = competencyRequired;
    }

    // Hiyerarşi kontrolü için yardımcı metot
    public Optional<String> getParentUnitId() {
        return Optional.ofNullable(parentUnitId);
    }
}