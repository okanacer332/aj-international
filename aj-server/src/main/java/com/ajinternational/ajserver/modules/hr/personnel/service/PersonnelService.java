package com.ajinternational.ajserver.modules.hr.personnel.service;

import com.ajinternational.ajserver.config.TenantContextHolder;
import com.ajinternational.ajserver.modules.audit.service.AuditLogService;
import com.ajinternational.ajserver.modules.hr.personnel.dto.CreatePersonnelRequest;
import com.ajinternational.ajserver.modules.hr.personnel.dto.UpdatePersonnelRequest;
import com.ajinternational.ajserver.modules.hr.personnel.model.Personnel;
import com.ajinternational.ajserver.modules.hr.personnel.model.PersonnelBonus; // YENİ IMPORT
import com.ajinternational.ajserver.modules.hr.personnel.repository.PersonnelRepository;
import com.ajinternational.ajserver.modules.iam.model.Role;
import com.ajinternational.ajserver.modules.iam.model.User;
import com.ajinternational.ajserver.modules.iam.repository.RoleRepository;
import com.ajinternational.ajserver.modules.iam.repository.UserRepository;
import com.ajinternational.ajserver.modules.masterdata.repository.ServiceDefinitionRepository;
import com.ajinternational.ajserver.modules.masterdata.repository.SkillDefinitionRepository;
import com.ajinternational.ajserver.modules.masterdata.repository.UnitDefinitionRepository;
import com.ajinternational.ajserver.modules.masterdata.model.ServiceDefinition;
import com.ajinternational.ajserver.modules.masterdata.model.SkillDefinition;
import com.ajinternational.ajserver.modules.masterdata.model.UnitDefinition;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.Optional;


@Service
@RequiredArgsConstructor
public class PersonnelService {

    private final PersonnelRepository personnelRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    private final UnitDefinitionRepository unitRepository;
    private final SkillDefinitionRepository skillRepository;
    private final ServiceDefinitionRepository serviceRepository;


    // --- LİSTELEME (DISPLAY FIX) ---
    public List<Personnel> findAllPersonnel() {
        String tenantId = TenantContextHolder.getCurrentTenantId();

        // 1. O tenant'taki tüm verileri harita (map) olarak çek
        List<Personnel> personnelList = personnelRepository.findByTenantId(tenantId);
        Map<String, User> userMap = userRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        Map<String, UnitDefinition> unitMap = unitRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(UnitDefinition::getId, Function.identity()));
        Map<String, SkillDefinition> skillMap = skillRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(SkillDefinition::getId, Function.identity()));
        Map<String, ServiceDefinition> serviceMap = serviceRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(ServiceDefinition::getId, Function.identity()));

        // 2. Personel listesini döngüye al ve geçici (@Transient) alanları doldur
        for (Personnel p : personnelList) {
            if (p.getUserId() != null) {
                p.setUser(userMap.get(p.getUserId()));
            }
            if (p.getUnitDefinitionId() != null) {
                p.setUnit(unitMap.get(p.getUnitDefinitionId()));
            }
            if (p.getSkillDefinitionId() != null) {
                p.setSkill(skillMap.get(p.getSkillDefinitionId()));
            }
            if (p.getServiceDefinitionId() != null) {
                p.setService(serviceMap.get(p.getServiceDefinitionId()));
            }
        }

        return personnelList;
    }

    @Transactional
    public Personnel createPersonnel(CreatePersonnelRequest request) {
        String currentTenantId = TenantContextHolder.getCurrentTenantId();
        String currentUsername = TenantContextHolder.getCurrentUsername();

        if (userRepository.existsByUsername(request.onxCode())) {
            throw new IllegalArgumentException("Bu ONXCode (Kullanıcı Adı) zaten kullanılıyor.");
        }
        if (personnelRepository.existsByTenantIdAndOnxCode(currentTenantId, request.onxCode())) {
            throw new IllegalArgumentException("Bu ONXCode (Personel Kodu) zaten kayıtlı.");
        }

        Role personnelRole = roleRepository.findByTenantIdAndName(currentTenantId, "PERSONNEL")
                .orElseThrow(() -> new RuntimeException("PERSONNEL rolü bulunamadı. Lütfen DataInitializer'ı kontrol edin."));

        // 1. Kullanıcıyı (User) oluştur
        User newUser = new User();
        newUser.setTenantId(currentTenantId);
        newUser.setFullName(request.fullName());
        newUser.setUsername(request.onxCode());
        newUser.setEmail(request.onxCode() + "@aj.local");
        newUser.setPassword(passwordEncoder.encode("1234"));
        newUser.setActive(true);
        newUser.setRoleIds(Set.of(personnelRole.getId()));

        User savedUser = userRepository.save(newUser);

        // 2. Personeli (Personnel) oluştur
        Personnel newPersonnel = new Personnel();
        newPersonnel.setTenantId(currentTenantId);
        newPersonnel.setUserId(savedUser.getId());
        newPersonnel.setOnxCode(request.onxCode());
        newPersonnel.setHireDate(request.hireDate());
        newPersonnel.setPhone(request.phone());
        newPersonnel.setUnitDefinitionId(request.unitDefinitionId());
        newPersonnel.setSkillDefinitionId(request.skillDefinitionId());
        newPersonnel.setServiceDefinitionId(request.serviceDefinitionId());

        // YENİ: Primleri Ekle
        if (request.bonuses() != null) {
            List<PersonnelBonus> bonuses = request.bonuses().stream()
                    .map(b -> new PersonnelBonus(b.bonusDefinitionId(), b.amount()))
                    .collect(Collectors.toList());
            newPersonnel.setAssignedBonuses(bonuses);
        }

        Personnel savedPersonnel = personnelRepository.save(newPersonnel);

        auditLogService.logAction(
                currentTenantId,
                currentUsername,
                "PERSONNEL_CREATED",
                "Yeni personel oluşturuldu: " + savedUser.getUsername()
        );

        return savedPersonnel;
    }


    @Transactional
    public Personnel updatePersonnel(String personnelId, UpdatePersonnelRequest request) {
        String currentTenantId = TenantContextHolder.getCurrentTenantId();
        String currentUsername = TenantContextHolder.getCurrentUsername();

        // 1. Personel kaydını bul (Tenant güvenli)
        Personnel personnel = personnelRepository.findByTenantIdAndId(currentTenantId, personnelId)
                .orElseThrow(() -> new RuntimeException("Personel kaydı bulunamadı veya yetkiniz yok."));

        // 2. İlişkili User kaydını bul
        User user = userRepository.findById(personnel.getUserId())
                .orElseThrow(() -> new RuntimeException("İlişkili kullanıcı kaydı bulunamadı: " + personnel.getUserId()));

        // 3. User (Kullanıcı) verilerini güncelle
        user.setFullName(request.fullName());
        userRepository.save(user);

        // 4. Personnel (İK) verilerini güncelle
        personnel.setHireDate(request.hireDate());
        personnel.setPhone(request.phone());
        personnel.setUnitDefinitionId(request.unitDefinitionId());
        personnel.setSkillDefinitionId(request.skillDefinitionId());
        personnel.setServiceDefinitionId(request.serviceDefinitionId());

        // YENİ: Primleri Güncelle
        if (request.bonuses() != null) {
            List<PersonnelBonus> bonuses = request.bonuses().stream()
                    .map(b -> new PersonnelBonus(b.bonusDefinitionId(), b.amount()))
                    .collect(Collectors.toList());
            personnel.setAssignedBonuses(bonuses);
        } else {
            // Eğer null gelirse (frontend göndermezse) listeyi temizle
            personnel.getAssignedBonuses().clear();
        }

        Personnel updatedPersonnel = personnelRepository.save(personnel);

        auditLogService.logAction(
                currentTenantId,
                currentUsername,
                "PERSONNEL_UPDATED",
                "Personel güncellendi: " + user.getUsername()
        );

        return updatedPersonnel;
    }

    @Transactional
    public void deletePersonnel(String personnelId) {
        String currentTenantId = TenantContextHolder.getCurrentTenantId();
        String currentUsername = TenantContextHolder.getCurrentUsername();

        Personnel personnel = personnelRepository.findByTenantIdAndId(currentTenantId, personnelId)
                .orElseThrow(() -> new RuntimeException("Personel kaydı bulunamadı veya silme yetkiniz yok."));

        String userId = personnel.getUserId();
        String onxCode = personnel.getOnxCode();

        personnelRepository.delete(personnel);
        userRepository.deleteById(userId);

        auditLogService.logAction(
                currentTenantId,
                currentUsername,
                "PERSONNEL_DELETED",
                "Personel ve ilişkili kullanıcı silindi: " + onxCode
        );
    }

    public Optional<Personnel> findPersonnelById(String id) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        Optional<Personnel> personnelOpt = personnelRepository.findByTenantIdAndId(tenantId, id);

        if (personnelOpt.isEmpty()) {
            return Optional.empty();
        }

        Personnel p = personnelOpt.get();
        userRepository.findById(p.getUserId()).ifPresent(p::setUser);
        unitRepository.findById(p.getUnitDefinitionId()).ifPresent(p::setUnit);

        return Optional.of(p);
    }
}