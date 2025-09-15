package com.ajinternational.ajserver.modules.auth.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    private String id;

    private String email;

    private String password; // BCrypt hash

    private String tenantId;

    private List<String> roles = new ArrayList<>();

    private boolean active = true;
}
