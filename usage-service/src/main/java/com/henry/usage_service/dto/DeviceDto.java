package com.henry.usage_service.dto;


import lombok.Builder;
import lombok.Setter;
import java.util.Map;

@Builder
public record DeviceDto(Long id,
                        String name,
                        String type,
                        String location,
                        Long userId,
                        Double energyConsumed,
                        Map<String, Double> dailyUsage) {
}