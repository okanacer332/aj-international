// aj-server/src/main/java/com/ajinternational/ajserver/modules/inventory/dto/StockReportDto.java
package com.ajinternational.ajserver.modules.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockReportDto {
    private String depotId;
    private String depotName;
    private List<StockReportLineDto> stockLines;
    private Double depotTotalStock; // Bu depo özelindeki toplam stok
}