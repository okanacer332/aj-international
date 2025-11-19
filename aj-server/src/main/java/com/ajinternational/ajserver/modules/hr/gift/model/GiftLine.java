package com.ajinternational.ajserver.modules.hr.gift.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GiftLine {
    private String productId; // MasterProduct ID
    private double quantity;  // Adet
    private String description; // "Kırmızı", "L Beden" vb.
}