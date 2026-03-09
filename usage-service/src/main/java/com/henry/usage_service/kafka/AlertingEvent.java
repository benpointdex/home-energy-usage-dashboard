package com.henry.usage_service.kafka;

import lombok.Builder;

@Builder
public record AlertingEvent(
        Long userId,
        String message,
        double threshold,
        double energyConsumed,
        String email
) {
}