package com.omnitech.drivingtracker.services

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object RetrofitClient{
    private const val BASE_URL = "http://10.0.2.2:3000/" //AVD path to dockerized backend

    //create retrofit API once for reuse across app
    val apiService: ApiService by lazy{
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
