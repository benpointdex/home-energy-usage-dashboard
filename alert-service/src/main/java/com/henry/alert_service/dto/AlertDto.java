package com.henry.alert_service.dto;

import java.time.LocalDateTime;

/**
 * GAP-03: AlertDto — projection of the Alert entity for REST responses.
 * Returned by GET /api/v1/alert/user/{userId}.
 */
public record AlertDto(
        Long id,
        Long userId,
        LocalDateTime createdAt,
        boolean sent
) {}
