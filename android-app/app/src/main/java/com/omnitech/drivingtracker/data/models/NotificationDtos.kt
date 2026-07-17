package com.omnitech.drivingtracker.data.models

import com.google.gson.annotations.SerializedName

data class RegisterFcmRequest(
    @SerializedName("fcm_token") val fcmToken: String
)

data class RegisterFcmResponse(
    val message: String
)

data class RespondContactRequest(
    val status: String
)

data class RespondContactResponse(
    val message: String,
    val data: RespondContactData
)

data class RespondContactData(
    @SerializedName("contact_id") val contactId: String
)



