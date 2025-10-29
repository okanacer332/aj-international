package com.ajinternational.ajserver.config.tenant;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@Order(1) // Bu filtrenin diğer Spring Security filtrelerinden önce çalışmasını sağlayabiliriz.
public class TenantFilter implements Filter {

    private static final Logger logger = LoggerFactory.getLogger(TenantFilter.class);
    private static final String TENANT_HEADER = "X-Tenant-ID";
    // Varsayılan bir tenant belirleyebiliriz, eğer header gelmezse kullanılır.
    // Şimdilik TR yapalım, daha sonra dinamik hale getirebiliriz.
    private static final String DEFAULT_TENANT = "TR";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String tenantId = httpRequest.getHeader(TENANT_HEADER);

        if (tenantId != null && !tenantId.trim().isEmpty()) {
            TenantContext.setCurrentTenant(tenantId);
            logger.debug("TenantFilter: X-Tenant-ID header bulundu: {}", tenantId);
        } else {
            // Eğer header yoksa veya boşsa, varsayılan tenant'ı kullanabiliriz.
            // Ya da hata fırlatabiliriz, projenin gereksinimine göre karar verilir.
            TenantContext.setCurrentTenant(DEFAULT_TENANT);
            logger.warn("TenantFilter: X-Tenant-ID header bulunamadı veya boş. Varsayılan tenant kullanılıyor: {}", DEFAULT_TENANT);
            // VEYA: throw new ServletException("X-Tenant-ID header zorunludur.");
        }

        try {
            chain.doFilter(request, response);
        } finally {
            // İstek işlendikten sonra ThreadLocal'ı temizle
            TenantContext.clear();
            logger.debug("TenantFilter: TenantContext temizlendi.");
        }
    }
}