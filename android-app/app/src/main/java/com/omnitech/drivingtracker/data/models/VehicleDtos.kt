package com.omnitech.drivingtracker.data.models

import com.google.gson.annotations.SerializedName

data class VehicleDto(
    @SerializedName("vehicle_id")
    val vehicleId: String,
    @SerializedName("registration")
    val registration: String,
    val make: String? = null,
    val model: String? = null,
    val year: Int? = null,
    @SerializedName("fuel_type")
    val fuelType: String? = null
)

data class AssignVehicleRequest(
	@SerializedName("vehicle_id") val vehicleId: String,
	val name: String,
	val registration: String,
	val make: String,
	val model: String,
	val year: Int,
	@SerializedName("fuel_type") val fuelType: String
)