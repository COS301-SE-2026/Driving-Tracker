package com.omnitech.drivingtracker.services

import com.omnitech.drivingtracker.data.models.ContactsResponse
import retrofit2.Call
import retrofit2.http.GET
import retrofit2.http.Header

interface ApiService{
    //returns trusted contacts for authenticated user
    //Backend expects JWT in the auth header
    @GET("contacts")
    fun getContacts(@Header("Authorization")
                    authorization: String
    ): Call<ContactsResponses>
}