package com.ajinternational.ajserver.modules.iam.service;

import org.springframework.stereotype.Service;
import java.util.Set;

@Service
public class PermissionService {

    private static final Set<String> SYSTEM_PERMISSIONS = Set.of(
            "PAGE_USERS:READ",
            "PAGE_USERS:WRITE",
            "PAGE_ROLES:READ",
            "PAGE_ROLES:WRITE",
            "PAGE_LOGS:READ",
            "PAGE_TASKS:READ",
            "PAGE_TASKS:WRITE",
            "PAGE_REPORTS:READ"
    );

    public Set<String> getSystemPermissions() {
        return SYSTEM_PERMISSIONS;
    }
}