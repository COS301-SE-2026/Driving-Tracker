package com.omnitech.drivingtracker.data.models

data class FatigueConfig(
    val standardAlertThresholdHours: Double = 2.0,
    val urgentAlertThresholdHours: Double = 2.0,
    val reAlertIntervalMinutes: Double =  25.0,
    val stoppedSpeedThresholdKmh: Float = 5f,
    val possibleStopDebounceSeconds:  Double = 300.0,
    val movingDebounceReadings: Int = 3,
    val maxElapsedSecondsPerTick: Double = 60.0,
)
