package com.henry.user_service.controller;


import com.henry.user_service.dto.RegistrationDto;
import com.henry.user_service.dto.UserDto;
import com.henry.user_service.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // ─────────────────────────────────────────────────────────
    // GAP-01: Unified registration — NO Authorization header needed
    // ─────────────────────────────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegistrationDto dto) {
        try {
            UserDto created = userService.register(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            if ("EMAIL_ALREADY_EXISTS".equals(e.getMessage())) {
                return ResponseEntity
                        .status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "An account with this email already exists"));
            }
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Registration failed. Please try again."));
        }
    }

    // ─────────────────────────────────────────────────────────
    // Existing CRUD endpoints
    // ─────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<UserDto> createUser(@RequestBody UserDto userDto) {
        UserDto created = userService.createUser(userDto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long id) {
        UserDto userDto = userService.getUserById(id);
        if (userDto == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        return ResponseEntity.ok(userDto);
    }

    @GetMapping("/by-email")
    public ResponseEntity<UserDto> getUserByEmail(@RequestParam String email) {
        UserDto userDto = userService.getUserByEmail(email);
        if (userDto == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        return ResponseEntity.ok(userDto);
    }

    // GAP-04: returns UserDto (JSON) instead of plain text string
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id,
                                        @RequestBody UserDto userDto) {
        try {
            UserDto updated = userService.updateUser(id, userDto);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(Map.of("error", "User not found"), HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

}
