package com.henry.device_service.controller;

import com.henry.device_service.dto.DeviceDto;
import com.henry.device_service.dto.DeviceStatusDto;
import com.henry.device_service.service.DeviceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * GAP-02: Device REST controller.
 *
 * Paths critical to usage-service internal calls (DO NOT RENAME):
 *   GET /api/v1/device/{id}          — called by usage-service aggregation job
 *   GET /api/v1/device/user/{userId} — called by usage-service getXDaysUsageForUser()
 *
 * Client-facing paths:
 *   POST   /api/v1/device        — register a new device
 *   PUT    /api/v1/device/{id}   — update device details
 *   DELETE /api/v1/device/{id}   — remove a device
 */
@RestController
@RequestMapping("/api/v1/device")
public class DeviceController {

    private final DeviceService service;

    public DeviceController(DeviceService service) {
        this.service = service;
    }

    // Called by usage-service internally — must stay at this exact path
    @GetMapping("/{id}")
    public ResponseEntity<DeviceDto> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.getById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Called by usage-service internally AND by the client — must stay at this exact path
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<DeviceDto>> getByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(service.getByUserId(userId));
    }

    @GetMapping
    public ResponseEntity<List<DeviceDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    // Client-facing: create a new device
    @PostMapping
    public ResponseEntity<DeviceDto> create(@RequestBody DeviceDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(dto));
    }

    // Client-facing: update device name, type, location
    @PutMapping("/{id}")
    public ResponseEntity<DeviceDto> update(@PathVariable Long id,
                                            @RequestBody DeviceDto dto) {
        try {
            return ResponseEntity.ok(service.update(id, dto));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Client-facing: toggle device status
    @PutMapping("/{id}/status")
    public ResponseEntity<DeviceDto> toggleStatus(
            @PathVariable Long id,
            @RequestBody DeviceStatusDto dto) {
        try {
            return ResponseEntity.ok(service.toggleStatus(id, dto.status()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Client-facing: delete a device
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        try {
            service.delete(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
