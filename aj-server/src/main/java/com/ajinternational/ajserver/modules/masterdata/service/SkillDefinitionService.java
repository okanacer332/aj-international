package com.ajinternational.ajserver.modules.masterdata.service;

import com.ajinternational.ajserver.config.TenantContextHolder;
import com.ajinternational.ajserver.modules.audit.service.AuditLogService;
import com.ajinternational.ajserver.modules.masterdata.model.SkillDefinition;
import com.ajinternational.ajserver.modules.masterdata.repository.SkillDefinitionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SkillDefinitionService {

    private final SkillDefinitionRepository skillRepository;
    private final AuditLogService auditLogService;

    // Tenant'a göre listeleme
    public List<SkillDefinition> findAllSkills() {
        UserDetails userDetails = TenantContextHolder.getCurrentUserDetails();
        String tenantId = TenantContextHolder.getCurrentTenantId();
        boolean isSuperAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (isSuperAdmin) {
            return skillRepository.findAll();
        } else {
            return skillRepository.findByTenantId(tenantId);
        }
    }

    // Tenant'a göre güvenli ID bulma
    public Optional<SkillDefinition> findById(String id) {
        UserDetails userDetails = TenantContextHolder.getCurrentUserDetails();
        String tenantId = TenantContextHolder.getCurrentTenantId();
        boolean isSuperAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (isSuperAdmin) {
            return skillRepository.findById(id);
        } else {
            return skillRepository.findByTenantIdAndId(tenantId, id);
        }
    }

    // Kaydetme veya Güncelleme
    public SkillDefinition saveSkill(SkillDefinition skillFromRequest) {
        String currentTenantId = TenantContextHolder.getCurrentTenantId();
        String currentUsername = TenantContextHolder.getCurrentUsername();

        // Benzersizlik kontrolü
        skillRepository.findByTenantIdAndSkillName(currentTenantId, skillFromRequest.getSkillName())
                .ifPresent(existing -> {
                    if (skillFromRequest.getId() == null || !existing.getId().equals(skillFromRequest.getId())) {
                        throw new IllegalArgumentException("Bu yetenek adı zaten kayıtlı.");
                    }
                });

        String logAction;
        String logDetails;
        SkillDefinition skillToSave;

        if (skillFromRequest.getId() == null) {
            // Yeni kayıt
            skillToSave = skillFromRequest;
            skillToSave.setTenantId(currentTenantId);
            logAction = "SKILL_DEFINITION_CREATED";
            logDetails = "Yeni yetenek oluşturuldu: " + skillToSave.getSkillName();
        } else {
            // Güncelleme
            skillToSave = findById(skillFromRequest.getId())
                    .orElseThrow(() -> new RuntimeException("Yetenek bulunamadı veya yetkiniz yok."));

            skillToSave.setSkillName(skillFromRequest.getSkillName());
            skillToSave.setTargetExperiencePercent(skillFromRequest.getTargetExperiencePercent());

            logAction = "SKILL_DEFINITION_UPDATED";
            logDetails = "Yetenek güncellendi: " + skillToSave.getSkillName();
        }

        SkillDefinition savedSkill = skillRepository.save(skillToSave);
        auditLogService.logAction(currentTenantId, currentUsername, logAction, logDetails);
        return savedSkill;
    }

    // Silme
    public void deleteSkill(String id) {
        String currentTenantId = TenantContextHolder.getCurrentTenantId();
        String currentUsername = TenantContextHolder.getCurrentUsername();

        SkillDefinition skillToDelete = findById(id)
                .orElseThrow(() -> new RuntimeException("Yetenek bulunamadı veya silme yetkiniz yok."));

        // TODO: Bu yeteneği kullanan personel var mı? Kontrolü eklenebilir.

        skillRepository.delete(skillToDelete);

        String logDetails = "Yetenek silindi: " + skillToDelete.getSkillName();
        auditLogService.logAction(currentTenantId, currentUsername, "SKILL_DEFINITION_DELETED", logDetails);
    }
}