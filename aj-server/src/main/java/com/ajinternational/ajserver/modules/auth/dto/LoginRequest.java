package com.ajinternational.ajserver.modules.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @Email(message = "Geçerli bir email giriniz")
        @NotBlank(message = "Email zorunludur")
        String email,

        @NotBlank(message = "Şifre zorunludur")
        String password
) {}
