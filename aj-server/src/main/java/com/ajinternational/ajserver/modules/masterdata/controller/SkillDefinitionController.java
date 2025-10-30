package com.ajinternational.ajserver.modules.masterdata.controller;

import com.ajinternational.ajserver.config.security.HasPermission;
import com.ajinternational.ajserver.modules.masterdata.model.SkillDefinition;
import com.ajinternational.ajserver.modules.masterdata.service.SkillDefinitionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/masterdata/skills")
@RequiredArgsConstructor
public class SkillDefinitionController {

    private final SkillDefinitionService skillService;

    @GetMapping
    @HasPermission("PAGE_SKILLS:READ")
    @PreAuthorize("hasAuthority('PAGE_SKILLS:READ')")
    public ResponseEntity<List<SkillDefinition>> getAllSkills() {
        return ResponseEntity.ok(skillService.findAllSkills());
    }

    @PostMapping
    @HasPermission("PAGE_SKILLS:WRITE")
    @PreAuthorize("hasAuthority('PAGE_SKILLS:WRITE')")
    public ResponseEntity<SkillDefinition> saveSkill(@Valid @RequestBody SkillDefinition skill) {
        return ResponseEntity.ok(skillService.saveSkill(skill));
    }

    @DeleteMapping("/{id}")
    @HasPermission("PAGE_SKILLS:WRITE")
    @PreAuthorize("hasAuthority('PAGE_SKILLS:WRITE')")
    public ResponseEntity<Void> deleteSkill(@PathVariable String id) {
        skillService.deleteSkill(id);
        return ResponseEntity.noContent().build();
    }
}