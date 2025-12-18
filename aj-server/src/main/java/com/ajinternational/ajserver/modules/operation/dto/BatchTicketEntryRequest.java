package com.ajinternational.ajserver.modules.operation.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

// Çoklu Fiş Girişi için "Paket" DTO'su
public record BatchTicketEntryRequest(
        @NotNull String tableId,
        @NotNull List<TicketItem> tickets, // Fişlerin Listesi (Miktar ve Tarih)
        List<String> workerIds,            // Global İşçi Listesi (Sadece 1 kere atanır)
        Integer durationMinutes            // Ortak Süre
) {
    // Liste içindeki her bir fişin yapısı
    public record TicketItem(Double amountKg, String customDate) {}
}