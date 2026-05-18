package com.omnitech.drivingtracker.data.models

import com.google.gson.annotations.SerializedName

@Suppress("unused")
enum class DataSource(val value: String){
    PHONE("PHONE"),
    OBD("OBD");

    override fun toString() = value
}
data class LocationDto(
    val lat: Double,
    val lng: Double
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
    val shareWithContacts: List<String>? = null
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
    val dataSource: String?
)