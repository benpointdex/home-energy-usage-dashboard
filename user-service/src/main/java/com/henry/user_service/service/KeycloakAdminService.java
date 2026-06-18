package com.henry.user_service.service;

import jakarta.ws.rs.core.Response;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * GAP-01: Keycloak Admin API wrapper.
 * Creates and deletes Keycloak user accounts as part of the unified registration flow.
 * The service-account credentials must be configured with the 'manage-users' realm role.
 */
@Slf4j
@Service
public class KeycloakAdminService {

    @Value("${keycloak.admin.server-url}")
    private String serverUrl;

    @Value("${keycloak.admin.realm}")
    private String realm;

    @Value("${keycloak.admin.client-id}")
    private String clientId;

    @Value("${keycloak.admin.client-secret}")
    private String clientSecret;

    private Keycloak buildAdminClient() {
        return KeycloakBuilder.builder()
                .serverUrl(serverUrl)
                .realm(realm)                       // authenticate against the target realm where the client is defined
                .clientId(clientId)
                .clientSecret(clientSecret)
                .grantType("client_credentials")
                .build();
    }

    /**
     * Creates a user in Keycloak.
     *
     * @return the Keycloak user ID (UUID string) on success
     * @throws RuntimeException with message "EMAIL_ALREADY_EXISTS" if the email is taken
     * @throws RuntimeException with status info on any other failure
     */
    public String createKeycloakUser(String email,
                                     String firstName,
                                     String lastName,
                                     String password) {
        try (Keycloak keycloak = buildAdminClient()) {

            // Build credential
            CredentialRepresentation credential = new CredentialRepresentation();
            credential.setType(CredentialRepresentation.PASSWORD);
            credential.setValue(password);
            credential.setTemporary(false);

            // Build user representation
            UserRepresentation user = new UserRepresentation();
            user.setUsername(email);            // use email as username
            user.setEmail(email);
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setEnabled(true);
            user.setEmailVerified(true);        // skip email verification in dev
            user.setCredentials(List.of(credential));

            Response response = keycloak.realm(realm).users().create(user);
            int status = response.getStatus();

            if (status == 201) {
                // Extract the created user's Keycloak ID from the Location header
                String location = response.getHeaderString("Location");
                String keycloakUserId = location.substring(location.lastIndexOf("/") + 1);
                log.info("Created Keycloak user {} with id {}", email, keycloakUserId);
                return keycloakUserId;
            } else if (status == 409) {
                log.warn("Keycloak rejected registration — email already exists: {}", email);
                throw new RuntimeException("EMAIL_ALREADY_EXISTS");
            } else {
                log.error("Keycloak user creation failed for {} with HTTP status {}", email, status);
                throw new RuntimeException("Keycloak user creation failed with status: " + status);
            }
        }
    }

    /**
     * Deletes a Keycloak user by their Keycloak UUID.
     * Used for best-effort rollback when MySQL insert fails after Keycloak creation succeeds.
     */
    public void deleteKeycloakUser(String keycloakUserId) {
        try (Keycloak keycloak = buildAdminClient()) {
            keycloak.realm(realm).users().get(keycloakUserId).remove();
            log.info("Rolled back Keycloak user {}", keycloakUserId);
        } catch (Exception e) {
            // Log but do not rethrow — best-effort rollback only
            log.error("Warning: failed to rollback Keycloak user {}: {}", keycloakUserId, e.getMessage());
        }
    }
}
