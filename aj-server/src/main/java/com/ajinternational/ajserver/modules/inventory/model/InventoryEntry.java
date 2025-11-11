// aj-server/src/main/java/com/ajinternational/ajserver/modules/inventory/model/InventoryEntry.java
package com.ajinternational.ajserver.modules.inventory.model;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@NoArgsConstructor
@Document(collection = "inventory_entries")
public class InventoryEntry {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    // Header Alanları (Excel Eşleştirmesine Göre)
    @NotNull
    private LocalDate entryDate; // TARİH
    @NotNull
    private LocalTime entryTime; // SAAT
    @NotNull
    private String operationType; // Yeni (örn: "Tedarikçi", "Lokal Toplama")

    @Indexed
    private String supplierId; // GELDİĞİ YER (SupplierDefinition ID)

    @Indexed
    private String targetDepotId; // Yeni (Hedef Depo - DepotDefinition ID)

    private String truckPlate; // TIR PLAKA
    private String trailerPlate; // DORSE PLAKA
    private String driverName; // ŞÖFÖRLER
    private String collectionArea; // İLÇE (Sadece OperationType = Lokal Toplama ise)
    private String weighbridgeNo; // KANTAR NO
    private String waybillNo; // İRSALİYE NO
    private String refNo1; // ARAPÇA FAT.NO
    private String refNo2; // SİSTEM G.N0
    private String description; // Açıklama

    // Line Alanları
    @NotEmpty
    private List<InventoryEntryLine> lines;
}