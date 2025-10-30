package com.ajinternational.ajserver.modules.masterdata.model;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@Document(collection = "master_skills")
// Bir tenant içinde Yetenek Adı benzersiz olmalı
@CompoundIndex(name = "tenant_skill_name_idx", def = "{'tenantId' : 1, 'skillName' : 1}", unique = true)
public class SkillDefinition {

    @Id
    private String id;

    private String tenantId;

    @NotBlank(message = "Yetenek adı boş olamaz")
    private String skillName;

    @Min(value = 0, message = "Tecrübe yüzdesi en az 0 olabilir")
    @Max(value = 100, message = "Tecrübe yüzdesi en fazla 100 olabilir")
    private Integer targetExperiencePercent = 0; // Hedeflenen veya standart tecrübe yüzdesi

    public SkillDefinition(String tenantId, String skillName, Integer targetExperiencePercent) {
        this.tenantId = tenantId;
        this.skillName = skillName;
        this.targetExperiencePercent = targetExperiencePercent;
    }
}