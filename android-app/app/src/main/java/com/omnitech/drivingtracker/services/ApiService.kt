package com.omnitech.drivingtracker.services

import com.omnitech.drivingtracker.data.models.*
import retrofit2.http.*

interface ApiService{
    //returns trusted contacts for authenticated user
    @GET("contacts")
    suspend fun getContacts(): ContactsResponse

    @POST("contacts")
    suspend fun createContact(@Body body: CreateContactRequest): CreateContactResponse

    @POST("contacts/alerts")
    suspend fun alertContacts(@Body body: AlertContactsRequest): GenericResponse

    @POST("contacts/share_location")
    suspend fun shareLocation(@Body body: ShareLocationRequest): GenericResponse

    @POST("api/auth/login")
    suspend fun login(@Body body: LoginRequest): AuthResponse

    @POST("api/auth/register")
    suspend fun register(@Body body: RegisterRequest): AuthResponse

    @POST("api/auth/refresh")
    suspend fun refresh(@Body body: RefreshRequest): AuthResponse

    @POST("api/auth/logout")
    suspend fun logout(): Unit

    @POST("api/trips/start")
    suspend fun startTrip(@Body body: StartTripRequest): StartTripResponse

    @GET("trips/history")
    suspend fun getTripHistory(@QueryMap filters: Map<String, String>): TripHistoryResponse

    @GET("trips/{trip_id}/summary")
    suspend fun getTripSummary(@Path("trip_id") tripId: String): TripSummaryResponse

    @PATCH("trips/{trip_id}/end_trip")
    suspend fun endTrip(
        @Path("trip_id") tripId: String,
        @Body body: EndTripRequest
    ): StartTripResponse

    //Achievements & Badges
    @POST("badges/evaluate")
    suspend fun evaluateBadges(
        @Header("Authorization") token: String, //JWT token is required
        @Body body: EvaluateBadgesRequest
    ): EvaluateBadgesResponse

    @GET("badges")
    suspend fun getBadges(
        @Header("Authorization") token: String
    ): GetBadgesResponse

    @GET("badges/definitions")
    suspend fun getBadgeDefinitions(
        @Header("Authorization") token: String
    ): BadgeDefinitionsResponse

    @GET("leaderboard")
    suspend fun getLeaderboard(
        @Header("Authorization") token: String
    ): LeaderboardResponse
}