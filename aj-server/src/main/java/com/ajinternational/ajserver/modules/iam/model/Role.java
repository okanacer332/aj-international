package com.ajinternational.ajserver.modules.iam.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@Document(collection = "roles")
public class Role {

    @Id
    private String id;

    @Indexed(unique = true)
    private String name; // Örn: "Saha Sorumlusu", "Admin"

    private Set<String> permissions = new HashSet<>(); // Örn: "TASK_CREATE", "USER_DELETE"

    public Role(String name) {
        this.name = name;
    }
}