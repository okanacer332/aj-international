package com.ajinternational.ajserver.modules.audit.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Document(collection = "audit_logs")
public class AuditLog {

    @Id
    private String id;
    private LocalDateTime timestamp; // İşlemin yapıldığı zaman
    private String username;         // İşlemi yapan kullanıcı
    private String action;           // Yapılan işlemin tipi (Örn: USER_LOGIN, USER_CREATED)
    private String details;          // İşlemle ilgili ek detaylar (Örn: "Created user: okan.acer")
    private String ipAddress;        // İsteğin yapıldığı IP adresi

    public AuditLog(String username, String action, String details, String ipAddress) {
        this.timestamp = LocalDateTime.now();
        this.username = username;
        this.action = action;
        this.details = details;
        this.ipAddress = ipAddress;
    }
}