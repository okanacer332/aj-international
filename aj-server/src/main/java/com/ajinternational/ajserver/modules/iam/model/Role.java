package com.ajinternational.ajserver.modules.iam.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex; // Bu satır eklendi
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@Document(collection = "roles")
// tenantId ve name'i birlikte benzersiz yap (TR'de 1 Admin, RU'da 1 Admin olabilir)
@CompoundIndex(name = "tenant_role_name_idx", def = "{'tenantId' : 1, 'name' : 1}", unique = true)
public class Role {

    @Id
    private String id;

    @Indexed // tenantId ile birlikte indexlenecek
    private String tenantId;

    private String name; // Örn: "Saha Sorumlusu", "Admin"

    private Set<String> permissions = new HashSet<>(); // Örn: "TASK_CREATE", "USER_DELETE"

    // Kurucu metodu tenantId alacak şekilde güncelledim
    public Role(String tenantId, String name) {
        this.tenantId = tenantId;
        this.name = name;
    }
}