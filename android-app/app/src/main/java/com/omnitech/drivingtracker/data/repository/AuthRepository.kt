package com.omnitech.drivingtracker.data.repository

import android.util.Log
import retrofit2.HttpException
import com.omnitech.drivingtracker.data.api.ApiErrorParser
import com.omnitech.drivingtracker.data.api.ApiException
import com.omnitech.drivingtracker.data.db.daos.UserDao
import com.omnitech.drivingtracker.data.db.entities.UserEntity
import com.omnitech.drivingtracker.data.local.SessionManager
import com.omnitech.drivingtracker.data.models.ForgotPasswordRequest
import com.omnitech.drivingtracker.data.models.LoginRequest
import com.omnitech.drivingtracker.data.models.LogoutResponse
import com.omnitech.drivingtracker.data.models.RegisterFcmRequest
import com.omnitech.drivingtracker.data.models.RegisterRequest
import com.omnitech.drivingtracker.services.ApiService
import javax.inject.Inject
import com.omnitech.drivingtracker.data.models.ProfileData
import com.omnitech.drivingtracker.data.models.DeleteAccountRequest
import com.omnitech.drivingtracker.data.models.ResetPasswordRequest

class AuthRepository @Inject constructor(
    private val api: ApiService,
    private val session_manager: SessionManager,
    private val userDao: UserDao
) {

    suspend fun insertUser(userEntity: UserEntity) = userDao.insertUser(userEntity)

    fun getRefreshToken(): String?  = session_manager.getRefreshToken()
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
                val response = api.registerFcmToken(RegisterFcmRequest(it))
                Log.d("FCM_SENT", response.message)
            }

            val userId = session_manager.getUserIdFromToken()

            if(!userId.isNullOrEmpty()){

                val entity = UserEntity(
                    userId = userId,
                    username = null,
                    name = null,
                    surname = null,
                    email = null
                )

                session_manager.saveUserId(userId)

                insertUser(entity)
            }

            Result.success(Unit)

        }catch(e: HttpException){
            val error = ApiErrorParser.parse(e)
            Result.failure(ApiException(error.error, error.message?: "An error occurred"))
        }catch(e: Exception){
            Log.e("Login_error", "Something wrong", e)
            Result.failure(ApiException("NETWORK_ERROR", "Network error, please try again"))
        }
    }

    suspend fun getProfile(): Result<ProfileData>{
        return try {
            val response = api.getProfile()
            Result.success(response.data)
        }catch (e: HttpException){
            val error = ApiErrorParser.parse(e)
            Result.failure(ApiException(error.error, error.message?: "Failed to fetch profile"))
        }catch (e: Exception){
            Result.failure(ApiException("NETWORK_ERROR", "Network error"))
        }
    }

    suspend fun logout(): Result<Unit>{
        return try{

            api.logout()

            Result.success(Unit)

        } catch(e: HttpException){
            val error = ApiErrorParser.parse(e)
            Result.failure(ApiException(error.error, error.message?: "Failed to logout"))
        } catch(e: Exception){
            Result.failure(ApiException("NETWORK_ERROR", "Network error"))
        } finally{
            session_manager.clearTokens()
        }

    }

    suspend fun deleteAccount(password: String): Result<Unit>{
        return try{
            api.deleteAccount(DeleteAccountRequest(password))
            session_manager.clearTokens()
            Result.success(Unit)
        }
        catch (e: HttpException){
            val error = ApiErrorParser.parse(e)
            Result.failure(ApiException(error.error, error.message ?: "Failed to delete account"))
        }
        catch (e: Exception){
            Result.failure(ApiException("NETWORK_ERROR", "Network error, please try again."))
        }
    suspend fun forgotPassword(email : String) : Result<Unit> = try{
        api.forgotPassword(ForgotPasswordRequest(email))
        Result.success(Unit)
    }catch(e: HttpException){
        val error = ApiErrorParser.parse(e)
        Result.failure(ApiException(error.error, error.message?: "Failed to send reset email"))
    }catch(e: Exception){
        Result.failure(e)
    }

    suspend fun resetPassword(token : String, newPassword: String) : Result<Unit> = try{
        api.resetPassword(ResetPasswordRequest(token, newPassword))
        Result.success(Unit)
    }catch(e: HttpException){
        val error = ApiErrorParser.parse(e)
        Result.failure(ApiException(error.error, error.message?: "Failed to reset password"))
    }catch(e: Exception){
        Result.failure(e)
    }

}