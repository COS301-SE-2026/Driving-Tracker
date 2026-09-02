package com.omnitech.drivingtracker.data.models

import com.google.gson.annotations.SerializedName

data class VehicleDto(
    @SerializedName("vehicle_id")
    val vehicleId: String,
    val name: String? = null,
    val registration: String? = null,
    val make: String? = null,
    val model: String? = null,
    val year: Int? = null,
    @SerializedName("fuel_type")
    val fuelType: String? = null,
    val mileage: Int? = null,
    @SerializedName("trip_count")
    val tripCount: Int? = null,
    @SerializedName("avg_fuel_efficiency")
    val avgFuelEfficiency: Double? = null
)

data class UpdateVehicleNameRequest(val name: String)
data class AssignVehicleRequest(
	val name: String?,
	val registration: String?,
	val make: String,
	val model: String,
	val year: Int,
	@SerializedName("fuel_type") val fuelType: String
)

data class AddVehicleResponse(
    val data: VehicleDto
)

data class FuelAnalyticsDto(
    @SerializedName("average_fuel_efficiency")
    val averageFuelEfficiency: Double? = null,
    @SerializedName("best_fuel_efficiency")
    val bestFuelEfficiency: Double?= null,
    @SerializedName("worst_fuel_efficiency")
    val worstFuelEfficiency: Double?= null,
    val history: List<FuelHistoryPointDto> = emptyList()
)

data class FuelHistoryPointDto(
    val date: String,
    @SerializedName("distance_km")
    val distanceKm: Double?= null,
    @SerializedName("fuel_used_liters")
    val fuelUsedLiters: Double?= null,
    @SerializedName("efficiency_l_per_100km")
    val efficiencyLPer100Km: Double?= null,
)