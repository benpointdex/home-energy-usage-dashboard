package com.henry.user_service.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * GAP-01: Unified registration DTO.
 * Carries both HET profile fields and Keycloak credential (password).
 */
public record RegistrationDto(

    @NotBlank(message = "First name is required")
    String name,

    @NotBlank(message = "Last name is required")
    String surname,

    @Email(message = "Valid email is required")
    @NotBlank(message = "Email is required")
    String email,

    @NotBlank(message = "Password is required")
    String password,

    String address,

    @NotNull(message = "Alerting preference is required")
    Boolean alerting,

    @NotNull(message = "Energy alerting threshold is required")
    @Positive(message = "Threshold must be a positive number")
    Double energyAlertingThreshold
) {}
