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