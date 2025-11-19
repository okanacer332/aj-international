package com.ajinternational.ajserver.modules.hr.gift.dto;

import com.ajinternational.ajserver.modules.hr.gift.model.RecipientType;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class GiftRecordResponse {
    private String id;
    private LocalDate date;
    private String recipientId;
    private String recipientName; // Zenginleştirilmiş isim (Frontend tabloda bunu gösterecek)
    private RecipientType recipientType;
    private String description;
    private List<GiftLineResponse> lines;

    @Data
    public static class GiftLineResponse {
        private String productId;
        private String productName; // Zenginleştirilmiş ürün adı
        private double quantity;
        private String description;
    }
}