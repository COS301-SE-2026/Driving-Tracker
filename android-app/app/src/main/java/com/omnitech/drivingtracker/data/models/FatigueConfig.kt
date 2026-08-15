package com.omnitech.drivingtracker.data.models

data class FatigueConfig(
    public val standardAlertThresholdHours: Double = 2.0,
    public val urgentAlertThresholdHours: Double = 2.0,
    public val reAlertIntervalMinutes: Double =  25.0,
    public val stoppedSpeedThresholdKmh: Float = 5f,
    public val possibleStopDebounceSeconds:  Double = 300.0,
    public val movingDebounceReadings: Int = 3,
    public val maxElapsedSecondsPerTick: Double = 60.0,
)
