package com.ajinternational.ajserver.modules.hr.personnel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.util.List;

public record CreatePersonnelRequest(
        @NotNull(message = "İşe giriş tarihi zorunludur")
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        LocalDate hireDate,

        @NotBlank(message = "ONXCode (Kullanıcı Adı) zorunludur")
        String onxCode,

        @NotBlank(message = "Ad Soyad zorunludur")
        String fullName,

        @NotBlank(message = "Birim seçimi zorunludur")
        String unitDefinitionId,

        String skillDefinitionId, // Opsiyonel

        @NotBlank(message = "Telefon numarası zorunludur")
        String phone,

        String serviceDefinitionId, // Opsiyonel

        // YENİ ALAN: Prim Listesi
        List<PersonnelBonusRequest> bonuses
) {
    // İç Record (Request için)
    public record PersonnelBonusRequest(
            String bonusDefinitionId,
            Double amount
    ) {}
}