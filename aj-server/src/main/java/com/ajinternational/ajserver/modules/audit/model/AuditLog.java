package com.ajinternational.ajserver.modules.audit.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed; // Bu satır eklendi
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Document(collection = "audit_logs")
public class AuditLog {

    @Id
    private String id;

    @Indexed // Bu alan eklendi (Logları tenanta göre filtrelemek için)
    private String tenantId;

    private LocalDateTime timestamp; // İşlemin yapıldığı zaman
    private String username;         // İşlemi yapan kullanıcı
    private String action;           // Yapılan işlemin tipi (Örn: USER_LOGIN, USER_CREATED)
    private String details;          // İşlemle ilgili ek detaylar (Örn: "Created user: okan.acer")
    private String ipAddress;        // İsteğin yapıldığı IP adresi

    // Kurucu metot tenantId alacak şekilde güncellendi
    public AuditLog(String tenantId, String username, String action, String details, String ipAddress) {
        this.timestamp = LocalDateTime.now();
        this.tenantId = tenantId; // Eklendi
        this.username = username;
        this.action = action;
        this.details = details;
        this.ipAddress = ipAddress;
    }
}