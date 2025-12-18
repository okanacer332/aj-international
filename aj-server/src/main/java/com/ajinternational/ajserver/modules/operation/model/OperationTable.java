package com.ajinternational.ajserver.modules.operation.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "operation_tables")
public class OperationTable {
    @Id
    private String id;

    @Indexed
    private String tenantId;

    private String tableNo;
    private OperationTableUnit unitType;
    private boolean active = true;

    // --- YENİ EKLENEN ALANLAR (HAVUZ SİSTEMİ) ---

    /**
     * Masaya giren toplam yük (Devir + Yeni Fişler + Transfer Giren).
     * Bu rakam, masadaki "Teorik Toplam"dır.
     */
    private Double totalPoolKg = 0.0;

    /**
     * Şu ana kadar "Tamamlandı" olarak beyan edilip işçilere dağıtılan miktar.
     * Hesaplama Formülü: (TotalPoolKg - MasadaKalanMiktar)
     */
    private Double processedKg = 0.0;
}