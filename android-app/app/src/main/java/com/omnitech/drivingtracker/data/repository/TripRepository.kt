package com.omnitech.drivingtracker.data.repository

import android.util.Log
import com.omnitech.drivingtracker.data.api.ApiErrorParser
import com.omnitech.drivingtracker.data.api.ApiException
import com.omnitech.drivingtracker.data.db.daos.TripDao
import com.omnitech.drivingtracker.data.db.daos.TripEventDao
import com.omnitech.drivingtracker.data.db.daos.TripReadingDao
import com.omnitech.drivingtracker.data.db.entities.TripEntity
import com.omnitech.drivingtracker.data.db.entities.TripEventEntity
import com.omnitech.drivingtracker.data.db.entities.TripReadingEntity
import com.omnitech.drivingtracker.data.local.SessionManager
import com.omnitech.drivingtracker.data.models.*
import com.omnitech.drivingtracker.services.ApiService
import retrofit2.HttpException
import java.time.Instant
import javax.inject.Inject

class TripRepository @Inject constructor(
    private val api: ApiService,
    private val tripEventDao: TripEventDao,
    private val tripReadingDao: TripReadingDao,
    private val tripDao: TripDao,
    private val sessionManager: SessionManager
    ){

    suspend fun saveEventLocally(event: TripEventEntity) = tripEventDao.insertEvent(event)

    suspend fun markEventAsSynced(eventId: Int) = tripEventDao.markAsSynced(eventId)

    suspend fun saveReadingLocally(reading: TripReadingEntity) = tripReadingDao.insertReading(reading)

    suspend fun getUnsyncedReadings(tripId: String) =  tripReadingDao.getUnsyncedTripReadings(tripId)

    suspend fun markReadingsAsSynced(readingIds: List<Int>) = tripReadingDao.markAsSynced(readingIds)

    suspend fun saveTripLocally(trip: TripEntity) = tripDao.insertTrip(trip)

    //Sends unsynced readings in room db to backend
    suspend fun syncPendingReadings(tripId: String): Result<BatchReadingResponse?>{
        val unsynced = tripReadingDao.getUnsyncedTripReadings(tripId)
        if (unsynced.isEmpty()) return Result.success(null)

        try{

            //convert Room Entities to request shape (DTOs)
            val request = BatchReadingRequest(unsynced.map { entity ->

                val recordedAt = Instant.ofEpochMilli(entity.recordedAt).toString()
                RecordReadingRequest(
                    recorded_at = recordedAt,
                    data_source = "PHONE",
                    location = LocationDto(
                        lat = entity.latitude,
                        lng = entity.longitude
                    ),
                    speed_kmh = entity.speedKmh?: 0f,
                    accelerometer = entity.accelerometer?: 0f,
                    gyroscope_x = entity.gyroscopeX?: 0f,
                    gyroscope_y = entity.gyroscopeY?: 0f,
                    gyroscope_z = entity.gyroscopeZ?: 0f,
                    rpm = null,
                    coolant_temp_c = null,
                    fuel_trim_percent = null,
                    throttle_position = null,
                    dtc_codes = entity.dtcCodes?: emptyList()
                )
            })
            //Batch upload
            val response = api.recordBatchReadings(tripId, request)

            val readingIds = unsynced.map {  it.readingId }
            tripReadingDao.markAsSynced(readingIds)
            Log.d("TripTrackingService", "Synced ${unsynced.size} readings. Viewers = ${response.data.activeShareCount}")

            return Result.success(response)

        } catch(e: HttpException){
            val error = ApiErrorParser.parse(e)
            return Result.failure(ApiException(error.error, error.message ?: "Failed to start trip"))
        }catch(e: Exception){
            throw e
        }

    }

    suspend fun getMapToken(): Result<MapTokenData> {
        return try{
            val response = api.getMapToken()
            Result.success(response.data)
        }catch(e: HttpException){
            val error = ApiErrorParser.parse(e)
            Result.failure(ApiException(error.error, error.message ?: "Failed to get map token"))
        }
        catch (e: Exception) {
            Result.failure(ApiException("NETWORK_ERROR", "Network error: ${e.message}"))
        }
    }
    suspend fun startTrip(
        vehicleId: String,
        dataSource: String,
        latitude: Double,
        longitude: Double,
        destLat: Double? = null,
        destLng: Double? = null,
        selectedContactIds: List<String>?
    ) : Result<String>{
        return try{

            val startTime = Instant.now()
            val request = StartTripRequest(
                vehicleId = vehicleId,
                startDate = startTime.toString(),
                dataSource = dataSource,
                startLocation = LocationDto(lat = latitude, lng = longitude),
                endLocation = if (destLat != null && destLng != null) LocationDto(lat = destLat, lng = destLng) else null,
                shareWithContacts = selectedContactIds
            )

            val response = api.startTrip(request)

            val tripId = response.data.tripId

            val startTimeLong = runCatching {
                startTime.toEpochMilli()
            }.getOrDefault(System.currentTimeMillis())

            val localTrip = TripEntity(
                tripId = tripId,
                userId = sessionManager.getUserId()?: "unknown",
                vehicleId = vehicleId,
                status = "IN_PROGRESS",
                startLatitude = latitude,
                startLongitude = longitude,
                startTime = startTimeLong,
            )

            tripDao.insertTrip(localTrip)

            Result.success(response.data.tripId)
        }catch(e: HttpException){
            val error = ApiErrorParser.parse(e)
            Result.failure(ApiException(error.error, error.message ?: "Failed to start trip"))
        }catch(e: Exception){
            Result.failure(ApiException("NETWORK_ERROR", "Network error: ${e.message}"))
        }
    }

    suspend fun getVehicles(): Result<List<VehicleDto>> {
        return try {
            val response = api.getVehicles()
            Result.success(response)
        } catch (e: HttpException) {
            val error = ApiErrorParser.parse(e)
            Result.failure(ApiException(error.error, error.message ?: "Failed to fetch vehicles"))
        } catch (e: Exception) {
            Result.failure(ApiException("NETWORK_ERROR", "Network error: ${e.message}"))
        }
    }

    suspend fun getTripHistory(
        startDate: String? = null,
        endDate: String? = null,
        status: String? = null
    ): Result<TripHistoryData> {
        return try {
            // Provide default values if not specified
            val effectiveStartDate = startDate ?: Instant.now().minusSeconds(30 * 24 * 60 * 60).toString() // 30 days ago
            val effectiveEndDate = endDate ?: Instant.now().toString()
            
            val response = api.getTripHistory(
                startDate = effectiveStartDate,
                endDate = effectiveEndDate,
                status = status
            )
            Result.success(response.data)
        } catch (e: HttpException) {
            val error = ApiErrorParser.parse(e)
            // Handle case where server might throw 404 when no trips are found
            if (error.error == "NO_TRIPS_FOUND" || e.code() == 404) {
                Result.success(
                    TripHistoryData(
                        username = "",
                        startDate = startDate ?: "",
                        endDate = endDate ?: "",
                        totalTrips = 0,
                        trips = emptyList(),
                        meta = TripMetaDto(0.0, 0.0)
                    )
                )
            } else {
                Result.failure(ApiException(error.error, error.message ?: "Failed to fetch history"))
            }
        } catch (e: Exception) {
            Result.failure(ApiException("NETWORK_ERROR", "Network error: ${e.message}"))
        }
    }

    suspend fun getTripSummary(tripId: String): Result<TripSummaryDto>{
        return try{
            val response = api.getTripSummary(tripId)
            Result.success(response.data)
        }catch(e: HttpException){
            val error = ApiErrorParser.parse(e)
            Result.failure(ApiException(error.error, error.message ?: "Failed to fetch trip summary"))
        }catch(e: Exception){
            Result.failure(ApiException("NETWORK_ERROR", "Network error: ${e.message}"))
        }
    }

    suspend fun endTrip(
        tripId: String,
        endTime: String,
        status: String,
        distanceKm: Double? = null,
        durationMinutes: Int? = null,
        fuelEstimate: Double? = null,
        overallScore: Double? = null,
        endLocation: LocationDto? = null,
    ): Result<EndTripData>{
        return try{
            val request = EndTripRequest(
                endTime = endTime,
                status = status,
                distanceKm = distanceKm,
                durationMinutes = durationMinutes,
                fuelEstimate = fuelEstimate,
                overallScore = overallScore,
                endLocation = endLocation
            )
            val response = api.endTrip(tripId, request)
            Result.success(response.data)
        }catch(e: HttpException){
            val error = ApiErrorParser.parse(e)
            Result.failure(ApiException(error.error, error.message ?: "Failed to end trip"))
        }catch (e: Exception) {
            Result.failure(ApiException("NETWORK_ERROR", "Network error: ${e.message}"))
        }
    }
    suspend fun searchAddress(query: String): Result<List<AddressSearchResult>> {
        return try {
            val response = api.searchAddress(query)
            Result.success(response.data) // Return the list from the 'data' field
        } catch (e: HttpException) {
            val error = ApiErrorParser.parse(e)
            Result.failure(ApiException(error.error, error.message ?: "Failed to search address"))
        } catch (e: Exception) {
            Result.failure(ApiException("NETWORK_ERROR", "Network error: ${e.message}"))
        }
    }
    suspend fun getSuggestedRoute(start: LocationDto, dest: LocationDto): Result<SuggestedRouteData> {
        return try {
            val response = api.getSuggestedRoute(start.lat, start.lng, dest.lat, dest.lng)
            Result.success(response.data)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}