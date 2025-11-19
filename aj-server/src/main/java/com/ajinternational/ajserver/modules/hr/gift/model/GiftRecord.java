package com.ajinternational.ajserver.modules.hr.gift.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@Document(collection = "hr_gift_records")
public class GiftRecord {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    private LocalDate date;

    @Indexed
    private String recipientId; // Seçilen User veya Personnel ID'si

    private RecipientType recipientType;

    private List<GiftLine> lines;

    private String description; // Genel açıklama

    // Audit fields
    private String createdBy; // Veren kişi (Username)
}