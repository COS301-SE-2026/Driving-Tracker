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

    @GET("vehicle/get_all_vehicles/")
    suspend fun getVehicles(): List<VehicleDto>

    @POST("api/auth/login")
    suspend fun login(@Body body: LoginRequest): AuthResponse

    @POST("api/auth/register")
    suspend fun register(@Body body: RegisterRequest): AuthResponse

    @POST("api/auth/logout")
    suspend fun logout()

    @POST("trips/start_trip")
    suspend fun startTrip(@Body body: StartTripRequest): StartTripResponse

    @GET("trips/history")
    suspend fun getTripHistory(
        @Query("start_date") startDate: String?,
        @Query("end_date") endDate: String?,
        @Query("status") status: String?
    ): TripHistoryResponse

    @GET("trips/{trip_id}/summary")
    suspend fun getTripSummary(@Path("trip_id") tripId: String): TripSummaryResponse

    @PATCH("trips/{trip_id}/end_trip")
    suspend fun endTrip(
        @Path("trip_id") tripId: String,
        @Body body: EndTripRequest
    ): EndTripResponse

    //Achievements & Badges
    @POST("badges/evaluate")
    suspend fun evaluateBadges(
        @Body body: EvaluateBadgesRequest
    ): EvaluateBadgesResponse

    @GET("badges")
    suspend fun getBadges(): GetBadgesResponse

    @GET("badges/definitions")
    suspend fun getBadgeDefinitions(): BadgeDefinitionsResponse

    @GET("leaderboard")
    suspend fun getLeaderboard(@Query("category") category: String, //added to url
        @Query("scope") scope: String
    ): LeaderboardResponse

    @GET("leaderboard/categories")
    suspend fun getLeaderboardCategories(): LeaderboardCategoryResponse

    @GET("leaderboard/scopes")
    suspend fun getLeaderboardScopes(): LeaderboardScopesResponse

    //Notifications
    @POST("devices/fcm_token")
    suspend fun registerFcmToken(@Body body: RegisterFcmRequest): RegisterFcmResponse
  
    @GET("map/token")
    suspend fun getMapToken(): MapTokenResponse
}