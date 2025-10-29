package com.ajinternational.ajserver.modules.iam.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex; // CompoundIndex eklendi
import org.springframework.data.mongodb.core.index.Indexed; // Indexed importu durabilir ama artık name için kullanılmayacak
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@Document(collection = "roles")
// name alanının unique index'i kaldırıldı, yerine tenantId + name compound index eklendi
@CompoundIndex(name = "tenant_role_name_idx", def = "{'tenantId' : 1, 'name': 1}", unique = true)
public class Role {

    @Id
    private String id;

    // --- YENİ ALAN: tenantId eklendi ---
    @Indexed // Sorgulama performansı için tenantId'ye de index ekleyelim
    private String tenantId;
    // --- YENİ ALAN SONU ---

    // @Indexed(unique = true) // Bu kaldırıldı, CompoundIndex ile değiştirildi
    private String name; // Örn: "Saha Sorumlusu", "Admin"

    private Set<String> permissions = new HashSet<>(); // Örn: "TASK_CREATE", "USER_DELETE"

    // Constructor'a tenantId ekleyebiliriz (opsiyonel ama kullanışlı olabilir)
    public Role(String tenantId, String name) {
        this.tenantId = tenantId;
        this.name = name;
    }

    // Var olan constructor'ı koruyabiliriz veya kaldırabiliriz, ihtiyaca göre.
    // Eğer korunacaksa tenantId'yi null bırakır, dikkatli kullanılmalı.
    // public Role(String name) {
    //     this.name = name;
    // }
}