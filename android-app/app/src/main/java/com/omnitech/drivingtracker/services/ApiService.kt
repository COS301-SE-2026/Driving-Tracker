package com.omnitech.drivingtracker.services

import com.omnitech.drivingtracker.data.models.AuthResponse
import com.omnitech.drivingtracker.data.models.ContactsResponse
import com.omnitech.drivingtracker.data.models.LoginRequest
import com.omnitech.drivingtracker.data.models.RefreshRequest
import com.omnitech.drivingtracker.data.models.RegisterRequest
import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Header

interface ApiService{
    //returns trusted contacts for authenticated user
    @GET("contacts")
    fun getContacts(): Call<ContactsResponse>

    @POST("api/auth/login")
    suspend fun login(@Body body: LoginRequest): AuthResponse

    @POST("api/auth/register")
    suspend fun register(@Body body: RegisterRequest): AuthResponse

    @POST("api/auth/refresh")
    suspend fun refresh(@Body body: RefreshRequest): AuthResponse

    @POST("api/auth/logout")
    suspend fun logout(): Unit
}