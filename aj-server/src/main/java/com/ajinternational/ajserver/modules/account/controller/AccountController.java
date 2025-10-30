package com.ajinternational.ajserver.modules.account.controller;

import com.ajinternational.ajserver.config.TenantContextHolder; // YENİ IMPORT
import com.ajinternational.ajserver.modules.hr.knowledge.dto.KnowledgeUpdateRequest;
import com.ajinternational.ajserver.modules.hr.knowledge.model.UserProductKnowledge;
import com.ajinternational.ajserver.modules.hr.knowledge.service.UserProductKnowledgeService;
import com.ajinternational.ajserver.modules.iam.dto.ChangePasswordRequest;
import com.ajinternational.ajserver.modules.iam.dto.UpdateProfileRequest;
import com.ajinternational.ajserver.modules.iam.model.User;
import com.ajinternational.ajserver.modules.iam.service.UserService;
import com.ajinternational.ajserver.modules.storage.service.FileStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
public class AccountController {

    private final UserService userService;
    private final FileStorageService fileStorageService;
    private final UserProductKnowledgeService knowledgeService;

    // Giriş yapmış kullanıcının bilgilerini getirir
    @GetMapping("/me")
    public ResponseEntity<User> getMyProfile(Authentication authentication) {
        // GÜNCELLEME: authentication.getName() YERİNE TenantContextHolder KULLANILDI
        String username = TenantContextHolder.getCurrentUsername();
        return userService.getUserByUsername(username)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Giriş yapmış kullanıcının profilini günceller
    @PutMapping("/me")
    public ResponseEntity<User> updateMyProfile(Authentication authentication, @Valid @RequestBody UpdateProfileRequest request) {
        // GÜNCELLEME: authentication.getName() YERİNE TenantContextHolder KULLANILDI
        String username = TenantContextHolder.getCurrentUsername();
        User updatedUser = userService.updateMyProfile(username, request);
        return ResponseEntity.ok(updatedUser);
    }

    // Giriş yapmış kullanıcının şifresini değiştirir
    @PostMapping("/change-password")
    public ResponseEntity<Void> changeMyPassword(Authentication authentication, @Valid @RequestBody ChangePasswordRequest request) {
        // GÜNCELLEME: authentication.getName() YERİNE TenantContextHolder KULLANILDI
        String username = TenantContextHolder.getCurrentUsername();
        userService.changeMyPassword(username, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/avatar")
    public ResponseEntity<String> uploadAvatar(Authentication authentication, @RequestParam("file") MultipartFile file) {
        // GÜNCELLEME: authentication.getName() YERİNE TenantContextHolder KULLANILDI
        String username = TenantContextHolder.getCurrentUsername();
        String filePath = fileStorageService.storeFile(file, "avatars");
        userService.updateAvatarUrl(username, filePath);
        return ResponseEntity.ok(filePath);
    }

    // --- YENİ EKLENEN ENDPOINT'LER ---

    @GetMapping("/me/knowledge")
    public ResponseEntity<List<UserProductKnowledge>> getMyKnowledge(Authentication authentication) {
        // GÜNCELLEME: authentication.getName() YERİNE TenantContextHolder KULLANILDI
        String username = TenantContextHolder.getCurrentUsername();
        User user = (User) userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı."));
        List<UserProductKnowledge> knowledgeList = knowledgeService.getKnowledgeByUserId(user.getId());
        return ResponseEntity.ok(knowledgeList);
    }

    @PostMapping("/me/knowledge")
    public ResponseEntity<Void> saveMyKnowledge(Authentication authentication, @Valid @RequestBody List<KnowledgeUpdateRequest> requests) {
        // GÜNCELLEME: authentication.getName() YERİNE TenantContextHolder KULLANILDI
        String username = TenantContextHolder.getCurrentUsername();
        User user = (User) userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı."));
        knowledgeService.saveOrUpdateKnowledge(user.getId(), requests);
        return ResponseEntity.ok().build();
    }
}