// aj-server/src/main/java/com/ajinternational/ajserver/modules/inventory/dto/StockReportLineDto.java
package com.ajinternational.ajserver.modules.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockReportLineDto {
    private String materialId;
    private String materialName;
    private String materialCode;
    private Double totalStock; // Tonaj
}