package com.omnitech.drivingtracker.data.sensors

//fused sensor reading representation
//built from multiple sensor events
data class FusedReading(
    val timestamp: String,
    val linearAccelX: Float,
    val linearAccelY: Float,
    val linearAccelZ: Float,
    val gyroX: Float,
    val gyroY: Float,
    val gyroZ: Float,
    val speedKmh: Float,
    val latitude: Double,
    val longitude: Double
)

//detected driving event representation
data class FusedEvent(
    val type: String,
    val severity: Float,
    val timestamp: String,
    val latitude: Double,
    val longitude: Double,
    val speedKmh: Float,
    val sensorSource: String
)