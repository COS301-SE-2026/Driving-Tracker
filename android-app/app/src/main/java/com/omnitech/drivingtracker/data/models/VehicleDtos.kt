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
    val fuelType: String? = null
)

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