package com.henry.ingestion_service.simulation;

import java.time.LocalDateTime;

public enum DeviceProfile {

    THERMOSTAT(
        new double[]{
            0.3, 0.3, 0.3, 0.3, 0.3, 0.4,   // 0-5am: minimal overnight
            0.9, 1.0, 0.8, 0.5, 0.4, 0.4,   // 6-11am: morning peak
            0.4, 0.4, 0.4, 0.5, 0.8, 1.0,   // 12-5pm: afternoon rise
            1.0, 0.9, 0.7, 0.5, 0.4, 0.3    // 6-11pm: evening peak, then drop
        },
        0.025   // base kWh per minute at full load
    ),

    HEATER(
        new double[]{
            0.2, 0.2, 0.2, 0.2, 0.2, 0.6,   // 0-5am: off overnight
            1.0, 1.0, 0.7, 0.3, 0.2, 0.2,   // 6-11am: strong morning heat
            0.2, 0.2, 0.2, 0.3, 0.6, 1.0,   // 12-5pm: afternoon warmup
            1.0, 0.9, 0.8, 0.6, 0.4, 0.2    // 6-11pm: evening heat, then off
        },
        0.040   // high load device
    ),

    FRIDGE(
        new double[]{
            0.7, 0.7, 0.7, 0.7, 0.7, 0.8,   // always on, slight variation
            0.9, 1.0, 1.0, 0.9, 0.9, 0.9,   // morning: door opens more
            0.9, 0.9, 0.9, 0.9, 1.0, 1.0,   // lunchtime/evening cooking peak
            1.0, 0.9, 0.8, 0.7, 0.7, 0.7    // late night: quiet
        },
        0.008   // low constant load
    ),

    AC(
        new double[]{
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1,   // 0-5am: off at night
            0.1, 0.2, 0.4, 0.7, 0.9, 1.0,   // 6-11am: heats up through morning
            1.0, 1.0, 1.0, 1.0, 0.9, 0.8,   // 12-5pm: peak afternoon heat
            0.7, 0.5, 0.4, 0.3, 0.2, 0.1    // 6-11pm: cools down at night
        },
        0.035   // high summer load
    ),

    WASHER(
        new double[]{
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0,   // 0-5am: never runs at night
            0.0, 0.5, 0.8, 0.9, 0.8, 0.7,   // 6-11am: morning laundry
            0.5, 0.4, 0.3, 0.3, 0.4, 0.6,   // 12-5pm: occasional use
            0.7, 0.6, 0.4, 0.2, 0.0, 0.0    // 6-11pm: evening use, then off
        },
        0.030   // medium-high load but intermittent
    ),

    OTHER(
        new double[]{
            0.1, 0.1, 0.1, 0.1, 0.1, 0.2,
            0.4, 0.6, 0.7, 0.7, 0.6, 0.6,
            0.6, 0.6, 0.6, 0.6, 0.7, 0.8,
            0.8, 0.7, 0.6, 0.4, 0.2, 0.1
        },
        0.015
    );

    private final double[] hourlyLoadCurve;  // 24 values, index = hour of day
    private final double baseKwhPerMinute;

    DeviceProfile(double[] hourlyLoadCurve, double baseKwhPerMinute) {
        this.hourlyLoadCurve = hourlyLoadCurve;
        this.baseKwhPerMinute = baseKwhPerMinute;
    }

    /**
     * Maps device type string from DB to a DeviceProfile enum.
     * Falls back to OTHER for unknown types.
     */
    public static DeviceProfile fromType(String type) {
        if (type == null) return OTHER;
        return switch (type.toUpperCase()) {
            case "THERMOSTAT" -> THERMOSTAT;
            case "HEATER"     -> HEATER;
            case "FRIDGE"     -> FRIDGE;
            case "AC"         -> AC;
            case "WASHER"     -> WASHER;
            default           -> OTHER;
        };
    }

    /**
     * Calculate energy consumed (kWh) for one simulation tick.
     *
     * @param intervalMs     the simulation tick interval in milliseconds
     * @param userMultiplier per-user base multiplier (0.5 - 1.5), seeded from userId
     * @param random         Random instance for variance
     * @return kWh consumed in this tick
     */
    public double calculateEnergy(long intervalMs, double userMultiplier, java.util.Random random) {
        int hour = LocalDateTime.now().getHour();
        double hourlyFactor = hourlyLoadCurve[hour];

        // +/- 10% random fluctuation
        double fluctuation = 0.90 + random.nextDouble() * 0.20;

        // Convert interval to minutes
        double intervalMinutes = intervalMs / 60_000.0;

        double energy = baseKwhPerMinute * hourlyFactor * userMultiplier * fluctuation * intervalMinutes;

        // Round to 4 decimal places
        return Math.round(energy * 10_000.0) / 10_000.0;
    }

    /**
     * Same as calculateEnergy but for a specific historical hour
     * (used by the 7-day backfill).
     */
    public double calculateEnergyForHour(int hour, long intervalMs, double userMultiplier, java.util.Random random) {
        double hourlyFactor = hourlyLoadCurve[hour];
        double fluctuation = 0.90 + random.nextDouble() * 0.20;
        double intervalMinutes = intervalMs / 60_000.0;
        double energy = baseKwhPerMinute * hourlyFactor * userMultiplier * fluctuation * intervalMinutes;
        return Math.round(energy * 10_000.0) / 10_000.0;
    }
}
