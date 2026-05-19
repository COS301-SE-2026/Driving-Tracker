package com.omnitech.drivingtracker.data.repository

import com.omnitech.drivingtracker.data.api.ApiErrorParser
import com.omnitech.drivingtracker.data.api.ApiException
import com.omnitech.drivingtracker.data.models.ConsentStatus
import com.omnitech.drivingtracker.data.models.ContactDto
import com.omnitech.drivingtracker.services.RetrofitClient
import retrofit2.HttpException

class ContactsRepository{
    suspend fun fetchContacts(): Result<List<ContactDto>>{
        return try{
            val response = RetrofitClient.apiService.getContacts() //call API
            Result.success(response.data.contacts) //extract contacts, wrap in success
        } catch(e: HttpException){
            val error = ApiErrorParser.parse(e) //parse HTTP error
            Result.failure(ApiException(...)) //wrap in failur
        } catch(e: Exception){
            Result.failure(ApiException("NETWORK_ERROR", ...)) //handle other errors
        }
    }
    suspend fun fetchApprovedContacts(): Result<List<ContactDto>> {
        return fetchContacts().map{
            contacts -> contacts.filter{ //filter approved
                it.consentStatus == ConsentStatus.APPROVED
            }
        }
    }
}