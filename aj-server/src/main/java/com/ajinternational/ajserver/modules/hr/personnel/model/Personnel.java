package com.ajinternational.ajserver.modules.hr.personnel.model;

import com.ajinternational.ajserver.modules.iam.model.User;
import com.ajinternational.ajserver.modules.masterdata.model.ServiceDefinition;
import com.ajinternational.ajserver.modules.masterdata.model.SkillDefinition;
import com.ajinternational.ajserver.modules.masterdata.model.UnitDefinition;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@Document(collection = "hr_personnel")
public class Personnel {

    @Id
    private String id;

    @Indexed
    @NotBlank
    private String tenantId;

    @Indexed(unique = true)
    @NotBlank
    private String userId;

    @Indexed
    @NotBlank
    private String onxCode;

    @NotNull
    private LocalDate hireDate;

    @NotBlank
    private String phone;

    @Indexed
    @NotBlank
    private String unitDefinitionId;

    @Indexed
    private String skillDefinitionId; // Boş olabilir

    @Indexed
    private String serviceDefinitionId; // Boş olabilir

    // YENİ ALAN: Personele atanan primler
    private List<PersonnelBonus> assignedBonuses = new ArrayList<>();

    // --- GEÇİCİ ALANLAR (Transient) ---
    // Bu alanlar veritabanına kaydedilmez, sadece listeleme sırasında doldurulur.
    @Transient
    private User user;

    @Transient
    private UnitDefinition unit;

    @Transient
    private SkillDefinition skill;

    @Transient
    private ServiceDefinition service;
}