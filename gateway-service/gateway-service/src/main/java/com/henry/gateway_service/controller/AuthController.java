package com.henry.gateway_service.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Value("${keycloak.token-url}")
    private String keycloakTokenUrl;

    @Value("${keycloak.logout-url}")
    private String keycloakLogoutUrl;

    @Value("${keycloak.client-id}")
    private String clientId;

    @Value("${auth.cookie.name}")
    private String cookieName;

    @Value("${auth.cookie.max-age-seconds}")
    private int cookieMaxAge;

    private final RestTemplate restTemplate = new RestTemplate();

    // ── LOGIN ─────────────────────────────────────────────────────────────────

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestBody Map<String, String> body) {

        String email = body.get("email");
        String password = body.get("password");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "password");
        form.add("client_id", clientId);
        form.add("username", email);
        form.add("password", password);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    keycloakTokenUrl,
                    new HttpEntity<>(form, headers),
                    Map.class
            );

            Map<String, Object> tokens = response.getBody();
            if (tokens == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid response from auth server"));
            }

            String accessToken = (String) tokens.get("access_token");
            String refreshToken = (String) tokens.get("refresh_token");
            Integer expiresIn = (Integer) tokens.get("expires_in");

            ResponseCookie cookie = buildRefreshCookie(refreshToken, cookieMaxAge);

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(Map.of(
                            "access_token", accessToken,
                            "expires_in", expiresIn
                    ));

        } catch (HttpClientErrorException.Unauthorized e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid email or password"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Authentication failed: " + e.getMessage()));
        }
    }

    // ── REFRESH ───────────────────────────────────────────────────────────────

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refresh(
            @CookieValue(value = "${auth.cookie.name}", required = false) String refreshToken) {

        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "No session found"));
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "refresh_token");
        form.add("client_id", clientId);
        form.add("refresh_token", refreshToken);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    keycloakTokenUrl,
                    new HttpEntity<>(form, headers),
                    Map.class
            );

            Map<String, Object> tokens = response.getBody();
            if (tokens == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Session expired"));
            }

            String newAccessToken = (String) tokens.get("access_token");
            String newRefreshToken = (String) tokens.get("refresh_token");
            Integer expiresIn = (Integer) tokens.get("expires_in");

            ResponseCookie cookie = buildRefreshCookie(newRefreshToken, cookieMaxAge);

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(Map.of(
                            "access_token", newAccessToken,
                            "expires_in", expiresIn
                    ));

        } catch (HttpClientErrorException.Unauthorized e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Session expired. Please log in again."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Refresh failed: " + e.getMessage()));
        }
    }

    // ── LOGOUT ────────────────────────────────────────────────────────────────

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(value = "${auth.cookie.name}", required = false) String refreshToken) {

        ResponseCookie clearedCookie = buildRefreshCookie("", 0);

        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, clearedCookie.toString())
                    .build();
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", clientId);
        form.add("refresh_token", refreshToken);

        try {
            restTemplate.postForEntity(
                    keycloakLogoutUrl,
                    new HttpEntity<>(form, headers),
                    Void.class
            );
        } catch (Exception e) {
            // Ignore logout failure, still clear local cookie
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearedCookie.toString())
                .build();
    }

    // ── COOKIE BUILDER ────────────────────────────────────────────────────────

    private ResponseCookie buildRefreshCookie(String value, int maxAge) {
        return ResponseCookie.from(cookieName, value)
                .httpOnly(true)       // JS cannot read this
                .secure(false)        // set true in production (requires HTTPS)
                .sameSite("Lax")      // cookie sent on same-site/cross-port requests
                .path("/auth")        // cookie is ONLY sent to /auth/* endpoints
                .maxAge(maxAge)
                .build();
    }
}
