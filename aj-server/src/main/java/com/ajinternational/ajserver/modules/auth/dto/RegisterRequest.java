package com.ajinternational.ajserver.modules.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record RegisterRequest(
        @Email(message = "Geçerli bir email giriniz")
        @NotBlank(message = "Email zorunludur")
        String email,

        @NotBlank(message = "Şifre zorunludur")
        String password,

        @NotBlank(message = "TenantId zorunludur")
        String tenantId
) {}
