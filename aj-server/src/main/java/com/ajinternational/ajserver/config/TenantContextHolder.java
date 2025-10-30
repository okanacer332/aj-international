package com.ajinternational.ajserver.config;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * O anki isteği yapan kullanıcının kimlik (Authentication) bilgilerine
 * ve tenantId'sine (ülke) hızlıca erişmek için kullanılan yardımcı sınıftır.
 */
public class TenantContextHolder {

    /**
     * Güvenlik oturumundan o anki 'Principal' nesnesini (TenantAwarePrincipal) alır.
     */
    private static TenantAwarePrincipal getPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal() == null) {
            throw new IllegalStateException("Güvenlik oturumu bulunamadı veya kullanıcı doğrulanmamış.");
        }

        Object principal = authentication.getPrincipal();
        if (!(principal instanceof TenantAwarePrincipal)) {
            // Bu durum, sistemin beklemediği bir Principal tipiyle karşılaştığını gösterir.
            // (Örn: Filtre düzgün çalışmıyor)
            throw new IllegalStateException("Güvenlik oturumundaki Principal, TenantAwarePrincipal tipinde değil. Principal: " + principal.getClass().getName());
        }

        return (TenantAwarePrincipal) principal;
    }

    /**
     * O anki kullanıcının giriş yaptığı 'tenantId' (ülke kodu) bilgisini döndürür.
     * @return String (Örn: "TR", "RU", "DU")
     */
    public static String getCurrentTenantId() {
        return getPrincipal().tenantId();
    }

    /**
     * O anki kullanıcının 'UserDetails' nesnesini döndürür.
     */
    public static UserDetails getCurrentUserDetails() {
        return getPrincipal().userDetails();
    }

    /**
     * O anki kullanıcının 'username' bilgisini döndürür.
     */
    public static String getCurrentUsername() {
        return getCurrentUserDetails().getUsername();
    }
}