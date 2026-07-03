package com.omnitech.drivingtracker.data.models

import com.google.gson.annotations.SerializedName

data class RegisterFcmRequest(
    @SerializedName("fcm_token") val fcmToken: String
)

data class RegisterFcmResponse(
    val message: String
)

