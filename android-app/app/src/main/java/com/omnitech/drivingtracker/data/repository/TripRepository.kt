package com.omnitech.drivingtracker.data.repository

import com.omnitech.drivingtracker.data.api.ApiErrorParser
import com.omnitech.drivingtracker.data.api.ApiException
import com.omnitech.drivingtracker.data.models.*
import com.omnitech.drivingtracker.services.ApiService
import retrofit2.HttpException
import java.time.Instant
import javax.inject.Inject

class TripRepository @Inject constructor(private val api: ApiService){

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
        selectedContactIds: List<String>?
    ) : Result<String>{
        return try{
            val request = StartTripRequest(
                vehicleId = vehicleId,
                startDate = Instant.now().toString(),
                dataSource = dataSource,
                startLocation = LocationDto(lat = latitude, lng = longitude),
                shareWithContacts = selectedContactIds
            )

            val response = api.startTrip(request)
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
        safetyScore: Double? = null,
        ecoScore: Double? = null,
        overallScore: Double? = null
    ): Result<EndTripData>{
        return try{
            val request = EndTripRequest(
                endTime = endTime,
                status = status,
                distanceKm = distanceKm,
                durationMinutes = durationMinutes,
                fuelEstimate = fuelEstimate,
                safetyScore = safetyScore,
                ecoScore = ecoScore,
                overallScore = overallScore
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
}