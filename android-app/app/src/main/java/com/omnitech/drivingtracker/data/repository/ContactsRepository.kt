package com.omnitech.drivingtracker.data.repository

import com.omnitech.drivingtracker.data.api.ApiErrorParser
import com.omnitech.drivingtracker.data.api.ApiException
import com.omnitech.drivingtracker.data.models.AlertContactsRequest
import com.omnitech.drivingtracker.data.models.ConsentStatus
import com.omnitech.drivingtracker.data.models.ContactDto
import com.omnitech.drivingtracker.data.models.ContactIdWrapper
import com.omnitech.drivingtracker.data.models.CreateContactRequest
import com.omnitech.drivingtracker.data.models.ShareLocationRequest
import com.omnitech.drivingtracker.services.RetrofitClient
import retrofit2.HttpException

class ContactsRepository{
    suspend fun fetchContacts(): Result<List<ContactDto>>{
        return try{
            val response = RetrofitClient.apiService.getContacts() //call API
            Result.success(response.data.contacts) //extract contacts, wrap in success
        } catch(e: HttpException){
            val error = ApiErrorParser.parse(e) //parse HTTP error
            Result.failure(ApiException(error.error, error.message ?: "Failed to fetch contacts")) //wrap in failure
        } catch(e: Exception){
            Result.failure(ApiException("NETWORK_ERROR", e.message ?: "Network error")) //handle other errors
        }
    }
    suspend fun fetchApprovedContacts(): Result<List<ContactDto>> {
        return fetchContacts().map{
            contacts -> contacts.filter{ //filter approved
                it.consentStatus == ConsentStatus.APPROVED
            }
        }
    }

    suspend fun createContact(identifier: String): Result<Unit> {
        return try{
            RetrofitClient.apiService.createContact(
                CreateContactRequest(identifier = identifier)
            )
            Result.success(Unit)
        }catch(e: HttpException){
            val error = ApiErrorParser.parse(e)
            Result.failure(ApiException(error.error, error.message ?: "Failed to add contact"))
        }catch(e: Exception){
            Result.failure(ApiException("NETWORK_ERROR", e.message ?: "Network error"))
        }
    }

    suspend fun alertContacts(
        eventType: String,
        eventId: String?,
        message: String?,
        contactIds: List<String>
    ): Result<Unit> {
        return try{
            RetrofitClient.apiService.alertContacts(
                AlertContactsRequest(
                    event_type = eventType,
                    event_id = eventId,
                    message = message,
                    contacts = contactIds.map { ContactIdWrapper(it) }
                )
            )
            Result.success(Unit)
        }catch(e: HttpException){
            val error = ApiErrorParser.parse(e)
            Result.failure(ApiException(error.error, error.message ?: "Failed to alert contacts"))
        }catch(e: Exception){
            Result.failure(ApiException("NETWORK_ERROR", e.message ?: "Network error"))
        }
    }

    suspend fun shareLocation(
        tripId: String,
        contactIds: List<String>
    ): Result<Unit> {
        return try{
            RetrofitClient.apiService.shareLocation(
                ShareLocationRequest(
                    tripId = tripId,
                    contacts = contactIds.map { ContactIdWrapper(it) }
                )
            )
            Result.success(Unit)
        }catch(e: HttpException){
            val error = ApiErrorParser.parse(e)
            Result.failure(ApiException(error.error, error.message ?: "Failed to share location"))
        }catch(e: Exception){
            Result.failure(ApiException("NETWORK_ERROR", e.message ?: "Network error"))
        }
    }
}