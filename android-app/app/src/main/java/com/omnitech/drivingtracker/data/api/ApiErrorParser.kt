package com.omnitech.drivingtracker.data.api

import com.google.gson.Gson
import com.omnitech.drivingtracker.data.models.ErrorDto
import retrofit2.HttpException

object ApiErrorParser {

    fun parse(e : HttpException): ErrorDto {

        return try{
            val errorBody = e.response()?.errorBody()?.string()
            Gson().fromJson(errorBody, ErrorDto::class.java)
                ?: ErrorDto("UNKNOWN", "An unknown error occurred")
        }catch(ex: Exception){
            ErrorDto("PARSE_ERROR", "Failed to parse error response")
        }
    }
}