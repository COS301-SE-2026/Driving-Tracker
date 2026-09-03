package com.omnitech.drivingtracker.data.models

import com.google.gson.annotations.SerializedName

data class RegisterRequest(
    val username: String,
    val name: String,
    val surname: String,
    val email: String,
    val password: String,
    val phone_number: String,
    val dob: String,
    val consent_status: Boolean
)

data class LoginRequest(
    val identifier: String,
    val password: String
)

data class RefreshRequest(
    val refresh_token: String
)

data class AuthResponse(
    val token: String,
    val refresh_token: String
)

data class ProfileResponse(
    val data: ProfileData,
    val message: String? = null
)

data class LogoutResponse(
    val message: String? = null
)

data class RegisterResponse(
    val message: String
)

data class ForgotPasswordRequest(val email : String)

data class ResetPasswordRequest(
    val token : String,
    @SerializedName("password") val newPassword: String
)

data class ProfileData(
    @SerializedName("user_id")
    val userId: String,
    val username: String,
    val name: String,
    val surname: String,
    val email: String,
    @SerializedName("phone_number")
    val phoneNumber: String,
    val dob: String,
    @SerializedName("profile_picture_url")
    val profilePictureUrl: String? = null,
    @SerializedName("trip_count")
    val tripCount: Int,
    @SerializedName("badge_count")
    val badgeCount: Int,
    @SerializedName("vehicle_count")
    val vehicleCount: Int,
)