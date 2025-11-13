package com.ajinternational.ajserver.modules.hr.personnel.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@Document(collection = "hr_bonus_definitions")
public class BonusDefinition {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    private String name; // Prim Adı

    private Double amount; // Prim Tutarı

    private Double thresholdPercent; // Başlangıç Yüzdesi (Örn: 87.5)

    // İlişkiler
    @Indexed
    private String productionGroupId; // Üretim Grubu ID

    @Indexed
    private String productionSectionId; // Üretim Bölümü ID

    @Indexed
    private String currencyId; // Para Birimi ID

    // Listeleme ekranında ID yerine isim göstermek için geçici alanlar
    @Transient
    private String groupName;
    @Transient
    private String sectionName;
    @Transient
    private String currencyCode;
}