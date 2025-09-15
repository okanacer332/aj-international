package com.ajinternational.ajserver.modules.auth.dto;

public record AuthResponse(
        String accessToken,
        String refreshToken
) {}
