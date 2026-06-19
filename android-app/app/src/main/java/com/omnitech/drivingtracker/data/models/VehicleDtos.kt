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
