package com.omnitech.drivingtracker.data.repository

import com.omnitech.drivingtracker.data.api.ApiErrorParser
import com.omnitech.drivingtracker.data.api.ApiException
import com.omnitech.drivingtracker.data.models.AlertContactsRequest
import com.omnitech.drivingtracker.data.models.BadgeDefinitionsData
import com.omnitech.drivingtracker.data.models.ConsentStatus
import com.omnitech.drivingtracker.data.models.ContactDto
import com.omnitech.drivingtracker.data.models.ContactIdWrapper
import com.omnitech.drivingtracker.data.models.CreateContactRequest
import com.omnitech.drivingtracker.data.models.GetBadgesData
import com.omnitech.drivingtracker.data.models.GetBadgesResponse
import com.omnitech.drivingtracker.data.models.LeaderboardData
import com.omnitech.drivingtracker.data.models.ShareLocationRequest
import com.omnitech.drivingtracker.services.ApiService
import com.omnitech.drivingtracker.services.RetrofitClient
import retrofit2.HttpException

class AchievementsRepository(private val api: ApiService){

    suspend fun evaluateBages(){

    }

    suspend fun getBadges(): Result<GetBadgesData>{
        return try {
            val response = api.getBadges()
            Result.success(response.data)
        }catch(e: HttpException){
            val error = ApiErrorParser.parse(e)
            Result.failure(ApiException(error.error, error.message ?: "Failed to get badges"))
        } catch (e: Exception){
            Result.failure(ApiException("NETWORK_ERROR", "Network error: ${e.message}"))
        }
    }

    suspend fun getBadgeDefinitions(): Result<BadgeDefinitionsData>{
        return try {
            val response = api.getBadgeDefinitions()
            Result.success(response.data)
        }catch(e: HttpException){
            val error = ApiErrorParser.parse(e)
            Result.failure(ApiException(error.error, error.message ?: "Failed to get badge definitions"))
        } catch (e: Exception){
            Result.failure(ApiException("NETWORK_ERROR", "Network error: ${e.message}"))
        }
    }

    suspend fun getLeaderboard(category: String = "OVERALL",  scope: String = "GLOBAL") : Result<LeaderboardData>{
        return try{
            val response = api.getLeaderboard(category = category, scope = scope)
            Result.success(response.data)

        }catch(e: HttpException){
            val error = ApiErrorParser.parse(e)
            Result.failure(ApiException(error.error, error.message ?: "Failed to get leaderboard"))
        } catch (e: Exception){
            Result.failure(ApiException("NETWORK_ERROR", "Network error: ${e.message}"))
        }
    }
}