package com.omnitech.drivingtracker.data.repository

import com.omnitech.drivingtracker.data.api.ApiErrorParser
import com.omnitech.drivingtracker.data.api.ApiException
import com.omnitech.drivingtracker.data.local.SessionManager
import com.omnitech.drivingtracker.data.models.ContactDto
import com.omnitech.drivingtracker.data.models.NotificationDto
import com.omnitech.drivingtracker.data.models.RespondContactRequest
import com.omnitech.drivingtracker.data.models.RespondContactResponse
import com.omnitech.drivingtracker.data.models.SharedWithMeData
import com.omnitech.drivingtracker.data.models.SharedWithMeDto
import com.omnitech.drivingtracker.data.models.SharedWithMeResponse
import com.omnitech.drivingtracker.services.ApiService
import retrofit2.HttpException
import javax.inject.Inject

class NotificationsRepository @Inject constructor(private val api: ApiService, private val sessionManager: SessionManager) {

    suspend fun respondTrustedContactRequest(contactId: String, status: String): Result<RespondContactResponse>{
        return try{
            val response = api.respondToContactRequest(contactId, RespondContactRequest(status)) //call API
            Result.success(response) //extract contacts, wrap in success
        } catch(e: HttpException){
            val error = ApiErrorParser.parse(e) //parse HTTP error
            Result.failure(ApiException(error.error, error.message ?: "Failed to fetch respond to trusted contact response")) //wrap in failure
        } catch(e: Exception){
            Result.failure(ApiException("NETWORK_ERROR", e.message ?: "Network error")) //handle other errors
        }
    }

    fun hasRequestedBefore(): Boolean {
       return sessionManager.hasRequestedNotification()
    }

    fun markAsRequested() {
        return sessionManager.setNotificationRequested()
    }

    suspend fun getNotifications() : Result<List<NotificationDto>>{
        return try{
            val response = api.getNotifications()
            Result.success(response.data.notifications) //extract notifications, wrap in success
        } catch(e: HttpException){
            val error = ApiErrorParser.parse(e) //parse HTTP error
            Result.failure(ApiException(error.error, error.message ?: "Failed to fetch notifications")) //wrap in failure
        } catch(e: Exception){
            Result.failure(ApiException("NETWORK_ERROR", e.message ?: "Network error")) //handle other errors
        }
    }

    suspend fun getTripsSharedWithMe() : Result<List<SharedWithMeDto>>{
        return try{
            val response = api.getTripsSharedWithMe()
            Result.success(response.data.trips) //extract notifications, wrap in success
        } catch(e: HttpException){
            val error = ApiErrorParser.parse(e) //parse HTTP error
            Result.failure(ApiException(error.error, error.message ?: "Failed to fetch notifications")) //wrap in failure
        } catch(e: Exception){
            Result.failure(ApiException("NETWORK_ERROR", e.message ?: "Network error")) //handle other errors
        }
    }

}