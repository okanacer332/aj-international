package com.ajinternational.ajserver.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Kullanıcı adı boş olamaz")
        String username,

        @NotBlank(message = "Şifre boş olamaz")
        String password,

        // YENİ EKLENEN ALAN: Hangi ülkeye giriş yapılacağını belirtir.
        @NotBlank(message = "Tenant ID (Ülke) boş olamaz")
        String tenantId
) {}