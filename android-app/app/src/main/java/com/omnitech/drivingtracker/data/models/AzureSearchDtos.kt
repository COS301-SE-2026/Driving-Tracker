package com.omnitech.drivingtracker.data.models

import com.google.gson.annotations.SerializedName

//data class AddressSearchRequest(
//    val address: String,
//)

data class AddressSearchResponse(
    val message: String,
    val data: List<AddressSearchResult>
)

data class AddressSearchResult(
    val address: String,
    @SerializedName("lat")
    val latitude: Double,
    @SerializedName("lng")
    val longitude: Double
)
