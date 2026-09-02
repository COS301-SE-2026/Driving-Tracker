package com.omnitech.drivingtracker.data.models

import com.google.gson.annotations.SerializedName

/**
 * Data classes for Fuel Efficiency Comparison feature
 */

data class FuelComparisonResponse(
    val data: FuelComparisonData
)

data class FuelComparisonData(
    val vehicle: VehicleDto,
    @SerializedName("manufacturer_standard")
    val manufacturerStandard: Double,
    @SerializedName("user_average")
    val userAverage: Double,
    @SerializedName("peer_leaderboard")
    val peerLeaderboard: List<FuelRankDto>
)

data class FuelRankDto(
    val rank: Int,
    @SerializedName("user_id")
    val userId: String,
    @SerializedName("display_name")
    val displayName: String,
    val efficiency: Double
)