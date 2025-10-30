package com.ajinternational.ajserver.config;

import org.springframework.security.core.userdetails.UserDetails;

/**
 * Spring Security'nin Authentication nesnesinde 'Principal' olarak saklanacak olan
 * özel nesnemiz. Bu sayede, oturum boyunca hem UserDetails'e hem de
 * o an giriş yapılan tenantId'ye kolayca erişebileceğiz.
 */
public record TenantAwarePrincipal(
        UserDetails userDetails,
        String tenantId
) {
    // Record, getter'ları (userDetails() ve tenantId()) otomatik olarak oluşturur.
}