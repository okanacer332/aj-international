package com.ajinternational.ajserver.modules.iam.controller;

import com.ajinternational.ajserver.modules.iam.model.User;
import com.ajinternational.ajserver.modules.iam.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/iam/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')") // Bu sınıftaki tüm endpoint'ler sadece ADMIN rolü gerektirir.
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable String id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/roles")
    public ResponseEntity<User> updateUserRoles(@PathVariable String id, @RequestBody Set<String> roleIds) {
        return ResponseEntity.ok(userService.updateUserRoles(id, roleIds));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}