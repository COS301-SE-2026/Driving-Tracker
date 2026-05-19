/*package com.omnitech.drivingtracker.services

import com.omnitech.drivingtracker.data.models.ContactsResponse
import retrofit2.Call
import retrofit2.http.GET
import retrofit2.http.Header

interface ApiService{
    //returns trusted contacts for authenticated user
    @GET("contacts")
    fun getContacts(): Call<ContactsResponse>

    @POST("auth/login")
    fun login(@Body body: LoginRequest): Call<AuthResponse>

    @POST("auth/register")
    fun register(@Body body: RegisterRequest): Call<AuthResponse>

    @POST("auth/refresh")
    fun refresh(@Body body: RefreshRequest): Call<AuthResponse>
}*/