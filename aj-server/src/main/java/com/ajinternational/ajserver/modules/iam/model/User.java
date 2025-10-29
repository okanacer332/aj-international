package com.ajinternational.ajserver.modules.iam.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
// Indexed importu kaldırıldı (artık @CompoundIndex kullanılacak)
// import org.springframework.data.mongodb.core.index.Indexed;
// CompoundIndex import edildi
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@Document(collection = "users")
// --- DEĞİŞİKLİK BURADA: Bileşik İndeks Eklendi ---
// Bu indeks, 'username' ve 'tenantId' alanlarının BİRLİKTE benzersiz olmasını sağlar.
@CompoundIndex(name = "username_tenant_unique", def = "{'username': 1, 'tenantId': 1}", unique = true)
// --- DEĞİŞİKLİK SONU ---
public class User {

    @Id
    private String id;

    // --- DEĞİŞİKLİK BURADA: @Indexed(unique = true) kaldırıldı ---
    // @Indexed(unique = true) // Bu satırı kaldırıyoruz veya yorum satırı yapıyoruz
    private String username;
    // --- DEĞİŞİKLİK SONU ---

    private String fullName;

    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    private String tenantId; // Bu alan bileşik indekse dahil edildi

    @Field("roleIds")
    private Set<String> roleIds = new HashSet<>();

    private boolean active = true;

    private String avatarUrl;

    @Transient
    private Set<String> permissions = new HashSet<>();
}