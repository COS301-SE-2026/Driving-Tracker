package com.omnitech.drivingtracker.data.models

import com.google.gson.annotations.SerializedName

data class UploadProfilePictureResponse(
    val message: String? = null,
    val data: ProfilePictureData
)

data class ProfilePictureData(
    @SerializedName("profile_picture_url") val ProfilePictureUrl: String
)

data class UploadVehicleImageResponse(
    val message: String? = null,
    val data: VehicleImageData
)

data class VehicleImageData(
    @SerializedName("image_url") val imageUrl: String
)