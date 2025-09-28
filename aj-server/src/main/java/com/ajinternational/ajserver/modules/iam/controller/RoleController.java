package com.ajinternational.ajserver.modules.iam.controller;

import com.ajinternational.ajserver.config.security.HasPermission;
import com.ajinternational.ajserver.modules.iam.model.Role;
import com.ajinternational.ajserver.modules.iam.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; // YENİ IMPORT
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/iam/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    @PostMapping
    @HasPermission("PAGE_ROLES:WRITE")
    @PreAuthorize("hasAuthority('PAGE_ROLES:WRITE')")
    public ResponseEntity<Role> createRole(@RequestBody Role role) {
        return ResponseEntity.ok(roleService.createRole(role));
    }

    @GetMapping
    @HasPermission("PAGE_ROLES:READ")
    @PreAuthorize("hasAuthority('PAGE_ROLES:READ')")
    public ResponseEntity<List<Role>> getAllRoles() {
        return ResponseEntity.ok(roleService.getAllRoles());
    }

    @GetMapping("/{id}")
    @HasPermission("PAGE_ROLES:READ")
    @PreAuthorize("hasAuthority('PAGE_ROLES:READ')")
    public ResponseEntity<Role> getRoleById(@PathVariable String id) {
        return roleService.getRoleById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @HasPermission("PAGE_ROLES:WRITE")
    @PreAuthorize("hasAuthority('PAGE_ROLES:WRITE')")
    public ResponseEntity<Role> updateRole(@PathVariable String id, @RequestBody Role roleDetails) {
        return ResponseEntity.ok(roleService.updateRole(id, roleDetails));
    }

    @DeleteMapping("/{id}")
    @HasPermission("PAGE_ROLES:WRITE")
    @PreAuthorize("hasAuthority('PAGE_ROLES:WRITE')")
    public ResponseEntity<Void> deleteRole(@PathVariable String id) {
        roleService.deleteRole(id);
        return ResponseEntity.noContent().build();
    }
}