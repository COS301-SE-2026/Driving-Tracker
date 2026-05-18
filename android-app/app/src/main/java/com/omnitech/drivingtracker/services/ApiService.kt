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
    fun login(@Body body: LoginRequest): Call<AuthResponse>

    @POST("api/auth/register")
    fun register(@Body body: RegisterRequest): Call<AuthResponse>

    @POST("api/auth/refresh")
    fun refresh(@Body body: RefreshRequest): Call<AuthResponse>

    @POST("api/auth/logout")
    fun logout(): Unit
}