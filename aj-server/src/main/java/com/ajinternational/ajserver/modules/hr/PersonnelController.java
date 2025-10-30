package com.ajinternational.ajserver.modules.hr;

import com.ajinternational.ajserver.config.security.HasPermission;
import com.ajinternational.ajserver.modules.hr.personnel.dto.CreatePersonnelRequest;
import com.ajinternational.ajserver.modules.hr.personnel.dto.UpdatePersonnelRequest; // Eklendi
import com.ajinternational.ajserver.modules.hr.personnel.model.Personnel;
import com.ajinternational.ajserver.modules.hr.personnel.service.PersonnelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hr/personnel")
@RequiredArgsConstructor
public class PersonnelController {

    private final PersonnelService personnelService;

    // Personel listesini getir (Sadece READ yetkisi)
    @GetMapping
    @HasPermission("PAGE_PERSONNEL:READ")
    @PreAuthorize("hasAuthority('PAGE_PERSONNEL:READ')")
    public ResponseEntity<List<Personnel>> getPersonnel() {
        // Bu metot artık Service katmanında join'lenmiş veri döndürüyor
        return ResponseEntity.ok(personnelService.findAllPersonnel());
    }

    // Yeni personel oluştur (WRITE yetkisi)
    @PostMapping
    @HasPermission("PAGE_PERSONNEL:WRITE")
    @PreAuthorize("hasAuthority('PAGE_PERSONNEL:WRITE')")
    public ResponseEntity<Personnel> createPersonnel(@Valid @RequestBody CreatePersonnelRequest request) {
        Personnel createdPersonnel = personnelService.createPersonnel(request);
        return ResponseEntity.ok(createdPersonnel);
    }

    // --- YENİ ENDPOINT: GÜNCELLEME ---
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

    // --- YENİ ENDPOINT: SİLME ---
    @DeleteMapping("/{id}")
    @HasPermission("PAGE_PERSONNEL:WRITE")
    @PreAuthorize("hasAuthority('PAGE_PERSONNEL:WRITE')")
    public ResponseEntity<Void> deletePersonnel(@PathVariable String id) {
        personnelService.deletePersonnel(id);
        return ResponseEntity.noContent().build();
    }

    // (Gelecekte tekil getirme /api/hr/personnel/{id} eklenebilir)
}