package com.henry.device_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * GAP-02: Device entity mapped to the 'device' table in home_energy_tracker DB.
 * Note: energyConsumed is NOT stored here — it is populated by usage-service from InfluxDB.
 */
@Entity
@Table(name = "device")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Device {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String type;           // e.g. "THERMOSTAT", "HEATER", "FRIDGE"

    @Column
    private String location;       // e.g. "Living Room"

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Builder.Default
    @Column(nullable = false)
    private String status = "ON";
}
