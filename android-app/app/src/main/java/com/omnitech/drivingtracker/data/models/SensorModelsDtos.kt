package com.omnitech.drivingtracker.data.models

import org.checkerframework.checker.units.qual.Current

data class RecordReadingRequest(
    val recorded_at: String,
    val data_source: String,
    val location: LocationDto,
    val speed_kmh: Float,
    val accelerometer: Float,
    val gyroscope_x: Float,
    val gyroscope_y: Float,
    val gyroscope_z: Float,
    val rpm: Int?,
    val coolant_temp_c: Float?,
    val fuel_trim_percent: Float?,
    val throttle_position:Float?,
    val dtc_codes: List<String>
)

data class LogEventRequest(
    val event_type: String,
    val location: LocationDto,
    val severity: Float,
    val sensor_source: String,
    val timestamp: String,
)

data class LogEventResponse(
    val data: LogEventData
)

data class LogEventData(
    val event_id: String,
    val trip_id: String,
    val type: String,
    val severity: Float,
    val sensor_source: String,
    val timestamp: String,
    val message: String
)

data class LiveSensorMetrics(
    val speedKmh: Float = 0f,
    val latitude: Double = 0.0,
    val longitude: Double = 0.0,
    val linearAccelY: Float = 0f,
    val gyroZ: Float = 0f,
    val lastEventType: String? = null,
    val lastEventSeverity: Float? = null,
    val currentSpeedZone: SpeedZone = SpeedZone.STATIONARY
)

enum class SpeedZone{
    STATIONARY,
    CITY,
    SUBURBAN,
    HIGHWAY
}