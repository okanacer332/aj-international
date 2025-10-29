package com.ajinternational.ajserver.modules.audit.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed; // Indexed importu eklendi
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Document(collection = "audit_logs")
public class AuditLog {

    @Id
    private String id;

    // --- YENİ ALAN: tenantId eklendi ---
    @Indexed // Sorgulama performansı için index ekleyelim
    private String tenantId;
    // --- YENİ ALAN SONU ---

    private LocalDateTime timestamp; // İşlemin yapıldığı zaman
    private String username;         // İşlemi yapan kullanıcı
    private String action;           // Yapılan işlemin tipi (Örn: USER_LOGIN, USER_CREATED)
    private String details;          // İşlemle ilgili ek detaylar (Örn: "Created user: okan.acer")
    private String ipAddress;        // İsteğin yapıldığı IP adresi

    // Constructor güncellendi: tenantId parametresi eklendi
    public AuditLog(String tenantId, String username, String action, String details, String ipAddress) {
        this.tenantId = tenantId; // tenantId ataması eklendi
        this.timestamp = LocalDateTime.now();
        this.username = username;
        this.action = action;
        this.details = details;
        this.ipAddress = ipAddress;
    }
}