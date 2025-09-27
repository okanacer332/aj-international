package com.ajinternational.ajserver.modules.iam.service;

import com.ajinternational.ajserver.modules.iam.model.Role;
import com.ajinternational.ajserver.modules.iam.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;

    public Role createRole(Role role) {
        if (roleRepository.findByName(role.getName()).isPresent()) {
            throw new IllegalArgumentException("Bu rol adı zaten mevcut: " + role.getName());
        }
        return roleRepository.save(role);
    }

    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    public Optional<Role> getRoleById(String id) {
        return roleRepository.findById(id);
    }

    public Role updateRole(String id, Role roleDetails) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rol bulunamadı: " + id));

        // Rol adının başka bir rolde kullanılıp kullanılmadığını kontrol et
        Optional<Role> existingRoleWithName = roleRepository.findByName(roleDetails.getName());
        if(existingRoleWithName.isPresent() && !existingRoleWithName.get().getId().equals(id)) {
            throw new IllegalArgumentException("Bu rol adı zaten başka bir role ait: " + roleDetails.getName());
        }

        role.setName(roleDetails.getName());
        role.setPermissions(roleDetails.getPermissions());
        return roleRepository.save(role);
    }

    public void deleteRole(String id) {
        // Not: Bu rolü kullanan kullanıcılar varsa ne yapılacağına dair iş mantığı eklenebilir.
        // Şimdilik direkt siliyoruz.
        roleRepository.deleteById(id);
    }
}