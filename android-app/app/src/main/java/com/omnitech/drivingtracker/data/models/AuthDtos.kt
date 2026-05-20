package com.omnitech.drivingtracker.data.models

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