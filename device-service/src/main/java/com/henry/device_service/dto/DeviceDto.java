package com.henry.device_service.dto;

/**
 * GAP-02: DeviceDto — must match the contract expected by usage-service exactly.
 * energyConsumed is ALWAYS null from device-service; usage-service merges InfluxDB data onto it.
 */
public record DeviceDto(
        Long id,
        String name,
        String type,
        String location,
        Long userId,
        Double energyConsumed,    // always null from device-service; populated by usage-service
        String status
) {}
