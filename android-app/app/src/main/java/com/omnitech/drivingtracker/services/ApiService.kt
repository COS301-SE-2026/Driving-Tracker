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

    @GET("contacts/received_requests")
    suspend fun getReceivedContactRequests(): ReceivedRequestResponse

    @POST("contacts/share_location")
    suspend fun shareLocation(@Body body: ShareLocationRequest): GenericResponse

    @PATCH("contacts/{contact_id}/respond")
    suspend fun respondToContactRequest(
        @Path("contact_id") contactId: String,
        @Body body: RespondContactRequest
    ): RespondContactResponse

    @GET("vehicle/get_all_vehicles/")
    suspend fun getVehicles(): List<VehicleDto>

	@POST("vehicle/assign_vehicle")
	suspend fun assignVehicle(@Body body: AssignVehicleRequest): AddVehicleResponse

    @PATCH("vehicle/{vehicle_id}/name")
    suspend fun updateVehicleName(
        @Path("vehicle_id") vehicleId: String,
        @Body body: UpdateVehicleNameRequest
    ): GenericResponse

    @DELETE("vehicle/{vehicle_id}")
    suspend fun removeVehicle(@Path("vehicle_id") vehicleId: String) : GenericResponse

    @POST("api/auth/login")
    suspend fun login(@Body body: LoginRequest): AuthResponse

    @POST("api/auth/register")
    suspend fun register(@Body body: RegisterRequest): AuthResponse

    @POST("api/auth/logout")
    suspend fun logout(): LogoutResponse

    @GET("api/auth/profile")
    suspend fun getProfile(): ProfileResponse

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

    @GET("map/search")
    suspend fun searchAddress(@Query("address")address: String): AddressSearchResponse

    @GET("map/route")
    suspend fun getSuggestedRoute(
        @Query("start_lat") startLat: Double?,
        @Query("start_lng") startLng: Double?,
        @Query("dest_lat") destLat: Double?,
        @Query("dest_lng") destLng: Double?
    ): SuggestedRouteResponse

    @GET("notifications")
    suspend fun getNotifications(): NotificationsResponse
  
    @POST("trips/{trip_id}/readings/record")
    suspend fun recordReading(
        @Path("trip_id") tripId: String,
        @Body body: RecordReadingRequest
    )

    @POST("trips/{trip_id}/batch_readings/record")
    suspend fun recordBatchReadings(
        @Path("trip_id") tripId: String,
        @Body body: BatchReadingRequest
    ): BatchReadingResponse


    @POST("trips/{trip_id}/events/log")
    suspend fun logEvent(
        @Path("trip_id") tripId: String,
        @Body body: LogEventRequest
    ): LogEventResponse

    @GET("trips/{trip_id}/latest_location")
    suspend fun getLatestLocation(
        @Path("trip_id") tripId: String
    ): LatestLocationResponse

    @GET("trips/shared_with_me")
    suspend fun getTripsSharedWithMe(): SharedWithMeResponse

    @POST("users/me/delete")
    suspend fun deleteAccount(
        @Body request: DeleteAccountRequest
    )
}