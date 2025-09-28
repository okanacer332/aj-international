package com.ajinternational.ajserver.config.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Bir endpoint'in gerektirdiği yetki anahtarını tanımlar.
 * Bu annotasyon, PermissionService tarafından taranarak sistemdeki tüm
 * yetkilerin dinamik olarak bulunması için kullanılır.
 * Gerçek güvenlik kontrolü için @PreAuthorize("hasAuthority('...')") kullanılır.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface HasPermission {
    String value();
}