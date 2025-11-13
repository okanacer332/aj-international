package com.ajinternational.ajserver.modules.masterdata.model;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@Document(collection = "master_currencies")
// Bir tenant içinde Para Birimi Kodu (USD, EUR) benzersiz olmalı
@CompoundIndex(name = "tenant_currency_code_idx", def = "{'tenantId' : 1, 'code' : 1}", unique = true)
public class CurrencyDefinition {

    @Id
    private String id;

    private String tenantId;

    @NotBlank(message = "Para birimi adı boş olamaz")
    private String name; // Örn: "Amerikan Doları", "Türk Lirası"

    @NotBlank(message = "Para birimi kodu boş olamaz")
    private String code; // Örn: "USD", "TRY", "EUR"

    public CurrencyDefinition(String tenantId, String name, String code) {
        this.tenantId = tenantId;
        this.name = name;
        this.code = code;
    }
}