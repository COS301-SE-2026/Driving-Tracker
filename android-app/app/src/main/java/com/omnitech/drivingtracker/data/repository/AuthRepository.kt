package com.omnitech.drivingtracker.data.repository

import retrofit2.HttpException
import com.omnitech.drivingtracker.data.api.ApiErrorParser
import com.omnitech.drivingtracker.data.api.ApiException
import com.omnitech.drivingtracker.data.local.SessionManager
import com.omnitech.drivingtracker.data.models.LoginRequest
import com.omnitech.drivingtracker.data.models.RegisterFcmRequest
import com.omnitech.drivingtracker.data.models.RegisterRequest
import com.omnitech.drivingtracker.services.ApiService
import javax.inject.Inject

class AuthRepository @Inject constructor(
    private val api: ApiService,
    private val session_manager: SessionManager
) {
    suspend fun register(
        username: String,
        name: String,
        surname: String,
        email: String,
        password: String,
        phoneNumber: String,
        dob: String,
        consent_status: Boolean
    ):Result<Unit>{
        return try{
            val response = api.register(
                RegisterRequest(username,name,surname,email,password,phoneNumber,dob,consent_status)
            )
            session_manager.saveTokens(response.token,response.refresh_token)

            session_manager.getFcmToken()?.let{
                api.registerFcmToken(RegisterFcmRequest(it))
            }

            Result.success(Unit)

        }catch(e: HttpException){
           val error = ApiErrorParser.parse(e)
            Result.failure(ApiException(error.error, error.message?: "An error occurred"))
        }catch(e: Exception){
            e.printStackTrace()
        Result.failure(ApiException("NETWORK_ERROR", "Network error, please try again"))
    }
    }

    suspend fun login(identifier: String, password: String):Result<Unit>{
        return try{
            val response = api.login(
                LoginRequest(identifier, password)
            )
            session_manager.saveTokens(response.token,response.refresh_token)

            session_manager.getFcmToken()?.let{
                api.registerFcmToken(RegisterFcmRequest(it))
            }

            Result.success(Unit)

        }catch(e: HttpException){
            val error = ApiErrorParser.parse(e)
            Result.failure(ApiException(error.error, error.message?: "An error occurred"))
        }catch(e: Exception){
            Result.failure(ApiException("NETWORK_ERROR", "Network error, please try again"))
        }
    }

}