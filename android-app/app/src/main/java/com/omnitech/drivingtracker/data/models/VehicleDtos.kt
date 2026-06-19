package com.omnitech.drivingtracker.data.models

import com.google.gson.annotations.SerializedName

data class VehiclesResponse(
    val data: List<VehicleDto>,
    val message: String? = null
)

data class VehicleDto(
    @SerializedName("vehicle_id")
    val vehicleId: String,
    val name: String,
    val make: String? = null,
    val model: String? = null,
    val year: Int? = null,
    @SerializedName("registration")
    val registration: String? = null
)
