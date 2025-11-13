package com.ajinternational.ajserver.modules.hr.personnel.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PersonnelBonus {
    private String bonusDefinitionId;
    private Double amount; // Özelleştirilebilir tutar
}