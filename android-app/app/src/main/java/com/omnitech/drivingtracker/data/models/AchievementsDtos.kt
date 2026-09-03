package com.omnitech.drivingtracker.data.models
import com.google.gson.annotations.SerializedName

//This file is the data classes that match what the backend sends as JSON
//serialized name lets you use snake case without changing the endpoints

//Evaluate badges (POST /badges/evaluate)
data class EvaluateBadgesRequest(val data: EvaluateBadgesRequestData)
data class EvaluateBadgesRequestData(
    @SerializedName("user_id") val userId: String,
    @SerializedName("trip_id") val tripId: String
)

data class EvaluateBadgesResponse(val data: EvaluateBadgesData, val message: String)

data class EvaluateBadgesData(
    val evaluated: Boolean,
    @SerializedName("new_badges") val newBadges: List<NewBadge>
)

data class NewBadge(
    @SerializedName("badge_id") val badgeId: String,
    val name: String,
    val description: String,
    val category: String,
    @SerializedName("earned_at") val earnedAt: String,
    @SerializedName("icon_url") val iconUrl: String
)

//Badges (GET /badges)
data class GetBadgesResponse(val data: GetBadgesData)

data class GetBadgesData(val earned: List<EarnedBadge>, val summary: BadgeSummary)

data class EarnedBadge(
    @SerializedName("badge_id") val badgeId: String,
    val name: String,
    val category: String,
    val description: String,
    val current: Int
)
data class BadgeSummary(
    @SerializedName("Total_earned") val totalEarned: Int,
    val categories: List<BadgeCategoryCount>
)

data class BadgeCategoryCount(val category: String, val current: Int) //category and how many badges in this category you have

//Badge Definitions

data class BadgeDefinitionsResponse(val data: BadgeDefinitionsData)

data class BadgeDefinitionsData(val badges: List<BadgeDefinition>)

data class BadgeDefinition(
    @SerializedName("badge_id") val badgeId: String,
    val name: String,
    val description: String,
    val category: String,
    @SerializedName("icon_url") val iconUrl: String,
    val criteria: List<BadgeCriterion>
)
data class BadgeCriterion(
    val metric: String,
    val operator: String,
    val threshold: Double?,
    val target: Double?
)

//Leaderboard

data class LeaderboardResponse(val data: LeaderboardData)

data class LeaderboardData(
    val category: String,
    val scope: String,
    val entries: List<LeaderboardEntry>,
    @SerializedName("my_rank") val myRank: Int?, //can be null
    @SerializedName("my_score") val myScore: Double
)

data class LeaderboardEntry(
    val rank: Int,
    @SerializedName("user_id") val userId: String,
    @SerializedName("display_name") val displayName: String,
    val score: Double,
    @SerializedName("profile_picture_url") val profilePictureUrl: String ? = null
)

//Leaderboard categories & scopes
data class LeaderboardCategoryResponse(val data: LeaderboardCategoryData)

data class LeaderboardCategoryData(
    val categories: List<String>,
)

data class LeaderboardScopesResponse(val data: LeaderboardScopesData)

data class LeaderboardScopesData(
    val scopes: List<String>,
)
