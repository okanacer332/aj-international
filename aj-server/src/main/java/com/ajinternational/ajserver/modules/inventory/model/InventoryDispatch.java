// aj-server/src/main/java/com/ajinternational/ajserver/modules/inventory/model/InventoryDispatch.java
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
@Document(collection = "inventory_dispatches")
public class InventoryDispatch {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    // Header Alanları (Excel Eşleştirmesine Göre)
    @NotNull
    private LocalDate dispatchDate; // TARİH
    @NotNull
    private LocalTime dispatchTime; // SAAT

    @Indexed
    private String customerId; // MÜŞTERİ ADI (CustomerDefinition ID)

    @Indexed
    private String dispatchDepotId; // Yeni (Çıkış Deposu - DepotDefinition ID)

    private String truckPlate; // PLAKA
    private String trailerPlate; // DORSE PLAKA
    private String weighbridgeNo; // KANTAR NO
    private String containerNo; // KONTEYNER NO
    private String waybillNo; // İRSALİYE NO
    private String invoiceNo; // FATURA NO
    private String arabicInvoiceNo; // ARAPÇA F.NO
    private Double refAmount; // ARAPÇA F.T.

    // Line Alanları
    @NotEmpty
    private List<InventoryDispatchLine> lines;
}