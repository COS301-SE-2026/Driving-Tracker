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

class AchievementsRepository{

    suspend fun evaluateBages(){

    }

    suspend fun getBadges(){

    }

    suspend fun getBadgeDefinitions(){

    }

    suspend fun getLeaderboard(category: String = "OVERALL",  scope: String = "GLOBAL") : Result<LeaderboardData>{ //idk man
        return try{
            val response = RetrofitClient.apiService.getLeaderboard(token = getAuthHeader(), category = category, scope = scope)
            Result.success(response.data)
        }
        catch (e: Exception){
            Result.failure(e)
        }
    }
}