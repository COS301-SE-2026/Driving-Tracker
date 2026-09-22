package com.omnitech.drivingtracker.data.models

import com.google.gson.annotations.SerializedName

data class MapTokenResponse(
    val message: String,
    val data: MapTokenData
)

data class MapTokenData(
    val token: String,
    @SerializedName("auth_type")
    val authType: String
)

data class MapPoiResponse(
    val message: String,
    val data: MapPoiData
)

data class MapPoiData(
    val pois: List<MapPoiItem>
)

data class MapPoiItem(
    val name: String,
    val category: String?,
    val latitude: Double,
    val longitude: Double,
    val distanceMeters: Double,
    val address: String?
)

data class MapPoiRequest(
    val lat: Double,
    val lng: Double,
    val type: String?,
    val radius: Int?,
    val limit: Int?
)

data class RoadDefectsResponse(
    val message: String,
    val data: RoadDefectsData
)

data class RoadDefectsData(
    @SerializedName("radius_m")
    val radiusMeters: Double,
    val defects: List<RoadDefectItem>
)

data class RoadDefectItem(
    val lat: Double,
    val lng: Double,
    val reports: Int,
    @SerializedName("avg_severity")
    val avgSeverity: Double,
    @SerializedName("distance_m")
    val distanceMeters: Double,
    @SerializedName("bearing_deg")
    val bearingDegrees: Double
)

enum class PoiType(val value: String){
    PETROL("petrol"),
    REST_AREA("rest_area"),
    PARKING("parking"),
    STOPS("stops");

    override fun toString() = value
}