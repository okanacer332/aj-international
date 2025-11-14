package com.ajinternational.ajserver.modules.hr;

import com.ajinternational.ajserver.config.security.HasPermission;
import com.ajinternational.ajserver.modules.hr.personnel.dto.CreatePersonnelRequest;
import com.ajinternational.ajserver.modules.hr.personnel.dto.UpdatePersonnelRequest;
import com.ajinternational.ajserver.modules.hr.personnel.model.Personnel;
import com.ajinternational.ajserver.modules.hr.personnel.service.PersonnelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

// --- YENİ IMPORTLAR ---
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.RequestParam;
// --- IMPORTLAR SONU ---

@RestController
@RequestMapping("/api/hr/personnel")
@RequiredArgsConstructor
public class PersonnelController {

    private final PersonnelService personnelService;

    // ... (mevcut getPersonnel, createPersonnel, updatePersonnel, deletePersonnel metotları aynı kalır) ...

    @GetMapping
    @HasPermission("PAGE_PERSONNEL:READ")
    @PreAuthorize("hasAuthority('PAGE_PERSONNEL:READ')")
    public ResponseEntity<List<Personnel>> getPersonnel() {
        return ResponseEntity.ok(personnelService.findAllPersonnel());
    }

    @PostMapping
    @HasPermission("PAGE_PERSONNEL:WRITE")
    @PreAuthorize("hasAuthority('PAGE_PERSONNEL:WRITE')")
    public ResponseEntity<Personnel> createPersonnel(@Valid @RequestBody CreatePersonnelRequest request) {
        Personnel createdPersonnel = personnelService.createPersonnel(request);
        return ResponseEntity.ok(createdPersonnel);
    }

    @PutMapping("/{id}")
    @HasPermission("PAGE_PERSONNEL:WRITE")
    @PreAuthorize("hasAuthority('PAGE_PERSONNEL:WRITE')")
    public ResponseEntity<Personnel> updatePersonnel(
            @PathVariable String id,
            @Valid @RequestBody UpdatePersonnelRequest request
    ) {
        Personnel updatedPersonnel = personnelService.updatePersonnel(id, request);
        return ResponseEntity.ok(updatedPersonnel);
    }

    @DeleteMapping("/{id}")
    @HasPermission("PAGE_PERSONNEL:WRITE")
    @PreAuthorize("hasAuthority('PAGE_PERSONNEL:WRITE')")
    public ResponseEntity<Void> deletePersonnel(@PathVariable String id) {
        personnelService.deletePersonnel(id);
        return ResponseEntity.noContent().build();
    }

    // --- YENİ ENDPOINT: AVATAR GÜNCELLEME ---
    @PostMapping("/{personnelId}/avatar")
    @HasPermission("PAGE_PERSONNEL:WRITE") // Personel düzenleme yetkisiyle aynı
    @PreAuthorize("hasAuthority('PAGE_PERSONNEL:WRITE')")
    public ResponseEntity<String> updatePersonnelAvatar(
            @PathVariable String personnelId,
            @RequestParam("file") MultipartFile file)
    {
        // Bu metodu PersonnelService içinde oluşturacağız
        String filePath = personnelService.updatePersonnelAvatar(personnelId, file);
        return ResponseEntity.ok(filePath);
    }
    // --- YENİ ENDPOINT SONU ---
}