package com.ajinternational.ajserver.modules.hr.gift.dto;

import com.ajinternational.ajserver.modules.hr.gift.model.RecipientType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record CreateGiftRequest(
        @NotNull(message = "Tarih zorunludur.")
        LocalDate date,

        @NotBlank(message = "Alıcı seçimi zorunludur.")
        String recipientId,

        @NotNull(message = "Alıcı tipi zorunludur.")
        RecipientType recipientType,

        @NotEmpty(message = "En az bir ürün eklemelisiniz.")
        List<GiftLineRequest> lines,

        String description
) {
    public record GiftLineRequest(
            @NotBlank String productId,
            double quantity,
            String description
    ) {}
}