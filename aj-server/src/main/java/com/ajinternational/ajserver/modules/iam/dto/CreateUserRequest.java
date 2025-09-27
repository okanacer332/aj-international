package com.ajinternational.ajserver.modules.iam.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.Set;

public record CreateUserRequest(
        @NotBlank(message = "Ad Soyad boş olamaz")
        String fullName,

        @NotBlank(message = "Email boş olamaz")
        @Email(message = "Geçerli bir email adresi giriniz")
        String email,

        @NotBlank(message = "Tenant ID boş olamaz")
        String tenantId,

        @NotEmpty(message = "En az bir rol seçilmelidir")
        Set<String> roleIds
) {}