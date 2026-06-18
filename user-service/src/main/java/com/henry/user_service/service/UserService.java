package com.henry.user_service.service;


import com.henry.user_service.dto.RegistrationDto;
import com.henry.user_service.dto.UserDto;
import com.henry.user_service.entity.User;
import com.henry.user_service.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class UserService {

    private final UserRepository userRepository;
    private final KeycloakAdminService keycloakAdminService;

    public UserService(UserRepository userRepository,
                       KeycloakAdminService keycloakAdminService) {
        this.userRepository = userRepository;
        this.keycloakAdminService = keycloakAdminService;
    }

    // ──────────────────────────────────────────────────────────────────────
    // GAP-01: Unified registration — creates Keycloak account + MySQL record
    // ──────────────────────────────────────────────────────────────────────
    @Transactional
    public UserDto register(RegistrationDto dto) {
        String keycloakUserId = null;
        try {
            // Step 1: Create user in Keycloak
            keycloakUserId = keycloakAdminService.createKeycloakUser(
                    dto.email(), dto.name(), dto.surname(), dto.password()
            );

            // Step 2: Create user in MySQL
            UserDto userDto = new UserDto(
                    null,
                    dto.name(),
                    dto.surname(),
                    dto.email(),
                    dto.address(),
                    dto.alerting(),
                    dto.energyAlertingThreshold()
            );
            return createUser(userDto);

        } catch (RuntimeException e) {
            // Rollback: if MySQL insert failed but Keycloak user was created, delete it
            if (keycloakUserId != null) {
                keycloakAdminService.deleteKeycloakUser(keycloakUserId);
            }
            throw e;
        }
    }

    // ──────────────────────────────────────────────────────────────────────
    // Existing CRUD methods
    // ──────────────────────────────────────────────────────────────────────

    public UserDto createUser(UserDto input) {
        final User createdUser = User.builder()
                .name(input.getName())
                .surname(input.getSurname())
                .email(input.getEmail())
                .address(input.getAddress())
                .alerting(input.isAlerting())
                .energyAlertingThreshold(input.getEnergyAlertingThreshold())
                .build();

        final User saved = userRepository.save(createdUser);
        return toDto(saved);
    }

    public UserDto getUserById(Long id) {
        return userRepository.findById(id)
                .map(this::toDto)
                .orElse(null);
    }

    public UserDto getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .map(this::toDto)
                .orElse(null);
    }

    // GAP-04: changed return type from void → UserDto
    public UserDto updateUser(Long id, UserDto dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setName(dto.getName());
        user.setSurname(dto.getSurname());
        user.setEmail(dto.getEmail());
        user.setAddress(dto.getAddress());
        user.setAlerting(dto.isAlerting());
        user.setEnergyAlertingThreshold(dto.getEnergyAlertingThreshold());

        User saved = userRepository.save(user);
        return toDto(saved);
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        userRepository.delete(user);
    }

    private UserDto toDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .surname(user.getSurname())
                .email(user.getEmail())
                .address(user.getAddress())
                .alerting(user.isAlerting())
                .energyAlertingThreshold(user.getEnergyAlertingThreshold())
                .build();
    }
}