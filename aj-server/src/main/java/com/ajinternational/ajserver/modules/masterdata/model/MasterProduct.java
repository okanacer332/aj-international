package com.ajinternational.ajserver.modules.masterdata.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

// 'parentProductId' ve 'subProducts' kaldırıldı.

@Data
@NoArgsConstructor
@Document(collection = "master_products")
public class MasterProduct {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    @Indexed(unique = true) // Bu (kod) aynı kalıyor
    private String code;

    private String name;

    private String description;

    // --- YENİ ALANLAR (SADECE ALT ÜRÜNLER İÇİN) ---
    // Bu alanlar eski modelde zaten vardı, isimleri değişmedi
    private Double targetValue;
    private String measureDefinitionId;
    private boolean active = true;
    private Double wasteRate;

    // --- GÜNCELLENEN ALANLAR ---
    // 1. Ürünün hangi üretim bölümüne bağlı olduğunu tutar
    @Indexed
    private String productionUnitId; // (Yeni) 'parentProductId' yerine geldi

    // 2. 'premiumValue' alanı 'unitPrice' oldu
    private Double unitPrice; // (Değişti) 'premiumValue' yerine geldi


    // --- GEÇİCİ ALANLAR (Frontend'e veri taşımak için) ---
    @Transient
    private String groupName; // (Yeni) Bu ürünün bağlı olduğu Grubun adı

    @Transient
    private String sectionName; // (Yeni) Bu ürünün bağlı olduğu Bölümün adı
}