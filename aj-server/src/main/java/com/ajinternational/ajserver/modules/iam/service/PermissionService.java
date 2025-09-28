package com.ajinternational.ajserver.modules.iam.service;

import com.ajinternational.ajserver.config.security.HasPermission;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RestController;

import java.lang.reflect.Method;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class PermissionService implements ApplicationListener<ContextRefreshedEvent> {

    private final ApplicationContext context;
    private static final Set<String> SYSTEM_PERMISSIONS = ConcurrentHashMap.newKeySet();
    private boolean permissionsLoaded = false;

    /**
     * Bu metot, Spring context'i tamamen yüklendiğinde ve tüm bean'ler hazır olduğunda
     * otomatik olarak çalışır. Bu sayede döngüsel bağımlılık riski ortadan kalkar.
     */
    @Override
    public void onApplicationEvent(ContextRefreshedEvent event) {
        if (permissionsLoaded) {
            return; // Zaten yüklendiyse tekrar çalıştırma
        }

        Map<String, Object> controllers = context.getBeansWithAnnotation(RestController.class);
        for (Object controller : controllers.values()) {
            Class<?> targetClass = controller.getClass();
            if (targetClass.getName().contains("$$SpringCGLIB$$") || targetClass.getName().contains("$$EnhancerBySpringCGLIB$$")) {
                targetClass = targetClass.getSuperclass();
            }

            if (!targetClass.getPackageName().startsWith("com.ajinternational.ajserver.modules")) {
                continue;
            }

            for (Method method : targetClass.getDeclaredMethods()) {
                if (method.isAnnotationPresent(HasPermission.class)) {
                    HasPermission annotation = method.getAnnotation(HasPermission.class);
                    SYSTEM_PERMISSIONS.add(annotation.value());
                }
            }
        }
        System.out.println(">>> Sistemdeki dinamik yetkiler yüklendi: " + SYSTEM_PERMISSIONS.size() + " adet.");
        System.out.println(SYSTEM_PERMISSIONS);
        permissionsLoaded = true;
    }

    public Set<String> getSystemPermissions() {
        return SYSTEM_PERMISSIONS;
    }

    public boolean hasPermission(Authentication authentication, String permission) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals(permission));
    }
}