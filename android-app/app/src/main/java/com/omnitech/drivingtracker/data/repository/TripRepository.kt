package com.omnitech.drivingtracker.data.repository

import com.omnitech.drivingtracker.data.api.ApiErrorParser
import com.omnitech.drivingtracker.data.api.ApiException
import com.omnitech.drivingtracker.data.models.LocationDto
import com.omnitech.drivingtracker.data.models.StartTripRequest
import com.omnitech.drivingtracker.services.RetrofitClient
import retrofit2.HttpException
import java.time.Instant

class TripRepository{
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

            val response = RetrofitClient.apiService.startTrip(request)
            Result.success(response.data.tripId)
        }catch(e: HttpException){
            val error = ApiErrorParser.parse(e)
            Result.failure(ApiException(error.error, error.message ?: "Failed to start trip"))
        }catch(e: Exception){
            Result.failure(ApiException("NETWORK_ERROR", "Network error: ${e.message}"))
        }
    }

    suspend fun getTripHistory(): Result<TripHistoryData>{
        return try{
            val response = RetrofitClient.apiService.getTripHistory(emptyMap())
            Result.success(response.data)
        }catch(e: HttpException){
            val error = ApiErrorParser.parse(e)
            Result.failure(ApiException(error.error, error.message ?: "Failed to fetch history"))
        }catch(e: Exception){
            Result.failure(ApiException("NETWORK_ERROR", "Network error: ${e.message}"))
        }
    }

    suspend fun getTripSummary(tripId: String): Result<TripSummaryDto>{
        return try{
            val response = RetrofitClient.apiService.getTripSummary(tripId)
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
        durationMinutes: Int? = null
    ): Result<String>{
        return try{
            val request = EndTripRequest(
                endTime = endTime,
                status = status,
                distanceKm = distanceKm,
                durationMinutes = durationMinutes
            )
            val response = RetrofitClient.apiService.endTrip(tripId, request)
            Result.success(response.data.tripId)
        }catch(e: HttpException){
            val error = ApiErrorParser.parse(e)
            Result.failure(ApiException(error.error, error.message ?: "Failed to end trip"))
        }catch (e: Exception) {
            Result.failure(ApiException("NETWORK_ERROR", "Network error: ${e.message}"))
        }
    }
}