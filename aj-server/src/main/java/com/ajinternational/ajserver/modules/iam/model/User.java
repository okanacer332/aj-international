package com.ajinternational.ajserver.modules.iam.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
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

    private String password;

    private String tenantId;

    @Field("roleIds")
    private Set<String> roleIds = new HashSet<>();

    private boolean active = true;

    private String avatarUrl; // YENİ EKLENEN ALAN
}