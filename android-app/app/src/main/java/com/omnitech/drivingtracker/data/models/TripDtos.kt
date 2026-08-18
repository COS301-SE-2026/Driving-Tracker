package com.omnitech.drivingtracker.data.models

import com.google.gson.annotations.SerializedName

@Suppress("unused")
enum class DataSource(val value: String){
    PHONE("PHONE"),
    OBD("OBD");

    override fun toString() = value
}
data class LocationDto(
    val lat: Double?,
    val lng: Double?
)

data class LatestLocationResponse(
    val message: String,
    val data: LatestLocationData
)

data class LatestLocationData(
    @SerializedName("last_latitude")
    val lastLatitude: Double,
    @SerializedName("last_longitude")
    val lastLongitude: Double,
    @SerializedName("last_recorded_at")
    val lastRecordedAt: String,
    @SerializedName("last_speed_kmh")
    val lastSpeedKmh: Double,
    val status: String
)

data class SharedWithMeResponse(
    val message: String,
    val data: SharedWithMeData
)

data class SharedWithMeData(
    val trips: List<SharedWithMeDto>
)

data class SharedWithMeDto(
    @SerializedName("trip_id")
    val tripId: String,
    val owner: String,
    val status: String,
    @SerializedName("started_at")
    val startedAt: String,
    @SerializedName("start_latitude")
    val startLatitude: Double,
    @SerializedName("start_longitude")
    val startLongitude: Double,
    @SerializedName("fuel_estimate")
    val fuelEstimate: Double,
)

@Suppress("unused")
data class StartTripRequest(
    @SerializedName("vehicle_id")
    val vehicleId: String,
    @SerializedName("start_date")
    val startDate: String, //e.g "2026-05-19T12:00:00Z"
    @SerializedName("data_source")
    val dataSource: String,
    @SerializedName("start_location")
    val startLocation: LocationDto,
    @SerializedName("share_with_contacts")
    val shareWithContacts: List<String>? = null,
    @SerializedName("end_location")
    val endLocation: LocationDto? = null,
    @SerializedName("fuel_level_start")
    val fuelLevelStart: Float? = null
)

@Suppress("unused")
data class StartTripResponse(
    val message: String,
    val data: StartTripData
)

data class StartTripData(
    @SerializedName("trip_id")
    val tripId: String,
    @SerializedName("data_source")
    val dataSource: String?,
    @SerializedName("planned_distance_km")
    val plannedDistanceKm: Double? = null,
    @SerializedName("fuel_estimate")
    val fuelEstimate: Double? = null
)

data class TripHistoryResponse(
    val message: String,
    val data: TripHistoryData
)

data class TripHistoryRequest(
    @SerializedName("start_date")
    val startDate: String? = null,
    @SerializedName("end_date")
    val endDate: String? = null,
    val status: String? = null
)

data class TripHistoryData(
    val username: String? = null,
    @SerializedName("start_date")
    val startDate: String? = null,
    @SerializedName("end_date")
    val endDate: String? = null,
    @SerializedName("total_trips")
    val totalTrips: Int? = null,
    val trips: List<TripItemDto> = emptyList(),
    val meta: TripMetaDto? = null
)

data class TripItemDto(
    @SerializedName("trip_id")
    val tripId: String,
    @SerializedName("user_id")
    val userId: String,
    @SerializedName("vehicle_id")
    val vehicleId: String?,
    @SerializedName("start_time")
    val startTime: String,
    @SerializedName("end_time")
    val endTime: String?,
    @SerializedName("distance_km")
    val distanceKm: Double?,
    @SerializedName("duration_minutes")
    val durationMinutes: Int?,
    @SerializedName("fuel_estimate")
    val fuelEstimate: Double?,
    @SerializedName("data_source")
    val dataSource: String?,
    val status: String,
    @SerializedName("created_at")
    val createdAt: String,
    val trip_scores: List<TripScoreDto>?
)

data class TripMetaDto(
    @SerializedName("mean_distance")
    val meanDistance: Double? = null,
    @SerializedName("mean_minutes")
    val meanMinutes: Double? = null
)

data class TripScoreDto(
    @SerializedName("safety_score")
    val safetyScore: Double?,
    @SerializedName("eco_score")
    val ecoScore: Double?,
    @SerializedName("overall_score")
    val overallScore: Double?
)

// Trip Summary Response
data class TripSummaryResponse(
    val data: TripSummaryDto
)

data class TripSummaryDto(
    @SerializedName("trip_id")
    val tripId: String,
    @SerializedName("vehicle_id")
    val vehicleId: String?,
    @SerializedName("started_At")
    val startedAt: String,
    @SerializedName("ended_At")
    val endedAt: String?,
    val status: String,
    @SerializedName("data_source")
    val dataSource: String?,
    @SerializedName("route_polyline")
    val routePolyline: String?,
    @SerializedName("distance_km")
    val distanceKm: Double?,
    @SerializedName("duration_minutes")
    val durationMinutes: Int?,
    @SerializedName("fuel_estimate")
    val fuelEstimate: Double?,
    @SerializedName("destination_latitude")
    val destinationLatitude: Double? = null,
    @SerializedName("destination_longitude")
    val destinationLongitude: Double? = null,
    @SerializedName("fuel_level_end")
    val fuelLevelEnd: Float? = null,
    val scores: TripScoreDto?,
    val events: List<TripEventDto>

)

data class TripEventDto(
    @SerializedName("event_id")
    val eventId: String,
    @SerializedName("event_type")
    val eventType: String,
    val longitude: Double?,
    val latitude: Double?,
    val severity: Double?,
    @SerializedName("sensor_source")
    val sensorSource: String?,
    @SerializedName("time_stamp")
    val timestamp: String
)

// End Trip Request
data class EndTripRequest(
    @SerializedName("end_time")
    val endTime: String,
    @SerializedName("route_polyline")
    val routePolyline: String? = null,
    @SerializedName("distance_km")
    val distanceKm: Double? = null,
    @SerializedName("duration_minutes")
    val durationMinutes: Int? = null,
    @SerializedName("fuel_estimate")
    val fuelEstimate: Double? = null,
    val status: String,
    @SerializedName("safety_score")
    val safetyScore: Double? = null,
    @SerializedName("eco_score")
    val ecoScore: Double? = null,
    @SerializedName("overall_score")
    val overallScore: Double? = null,
    @SerializedName("end_location")
    val endLocation: LocationDto? = null,
    @SerializedName("fuel_level_end")
    val fuelLevelEnd: Float? = null
)

data class EndTripResponse(
    val message: String,
    val data: EndTripData
)

data class EndTripData(
    @SerializedName("trip_id")
    val tripId: String,
    @SerializedName("new_badges")
    val newBadges: List<NewBadge>? = null,
    @SerializedName("is_first_trip")
    val isFirstTrip: Boolean? = false
)
data class SuggestedRouteResponse(
    val message: String,
    val data: SuggestedRouteData
)
data class SuggestedRouteData(
    @SerializedName("distance_km")
    val distanceKm: Double,
    @SerializedName("travel_time_seconds")
    val travelTimeSeconds: Int,
    @SerializedName("points")
    val points: List<LocationDto>
)