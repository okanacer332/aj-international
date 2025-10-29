package com.ajinternational.ajserver.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        // YENİ ALAN: Tenant ID
        @NotBlank(message = "Tenant ID boş olamaz") // Hata mesajını daha sonra çeviri anahtarı ile değiştirebiliriz
        String tenantId,

        @NotBlank(message = "Kullanıcı adı boş olamaz")
        String username,

        @NotBlank(message = "Şifre boş olamaz")
        String password
) {}