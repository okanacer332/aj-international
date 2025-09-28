package com.ajinternational.ajserver.modules.iam.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient; // YENİ IMPORT
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    private String id;

    @Indexed(unique = true)
    private String username;

    private String fullName;

    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY) // Bu alanın JSON yanıtında gitmesini engeller
    private String password;

    private String tenantId;

    @Field("roleIds")
    private Set<String> roleIds = new HashSet<>();

    private boolean active = true;

    private String avatarUrl;

    // YENİ EKLENEN ALAN: Bu alan veritabanına kaydedilmez.
    // Sadece /me endpoint'inden frontend'e kullanıcının tüm yetkilerini göndermek için kullanılır.
    @Transient
    private Set<String> permissions = new HashSet<>();
}