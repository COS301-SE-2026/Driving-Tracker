package com.omnitech.drivingtracker.data.repository

import com.omnitech.drivingtracker.data.api.ApiErrorParser
import com.omnitech.drivingtracker.data.api.ApiException
import com.omnitech.drivingtracker.data.models.AddVehicleResponse
import com.omnitech.drivingtracker.data.models.AssignVehicleRequest
import com.omnitech.drivingtracker.data.models.UpdateVehicleNameRequest
import com.omnitech.drivingtracker.services.ApiService
import javax.inject.Inject
import com.omnitech.drivingtracker.data.models.VehicleDto
import okhttp3.MultipartBody
import com.omnitech.drivingtracker.data.models.FuelAnalyticsDto
import retrofit2.HttpException

class VehicleRepository  @Inject constructor(private val apiService: ApiService){
    suspend fun getVehicles() : Result<List<VehicleDto>> = try {
        Result.success(apiService.getVehicles())
    }catch (e: HttpException){
        val error = ApiErrorParser.parse(e)
        Result.failure(ApiException(error.error, error.message ?: "Failed to fetch vehicle"))
    }catch (e: Exception){
        Result.failure(e)
    }

    suspend fun addVehicle(req: AssignVehicleRequest) : Result<AddVehicleResponse> = try {
        val response = apiService.assignVehicle(req)
        Result.success(response)
    }catch (e: HttpException){
        val error = ApiErrorParser.parse(e)
        Result.failure(ApiException(error.error, error.message ?: "Failed to add vehicle"))
    }catch (e: Exception){
        Result.failure(e)
    }

    suspend fun updateVehicleName(vehicleId: String, name: String): Result<Unit> = try {
        apiService.updateVehicleName(vehicleId, UpdateVehicleNameRequest(name))
        Result.success(Unit)
    }catch (e: HttpException){
        val error = ApiErrorParser.parse(e)
        Result.failure(ApiException(error.error, error.message ?: "Failed to update vehicle name"))
    }catch (e: Exception){
        Result.failure(e)
    }

    suspend fun removeVehicle(vehicleId: String): Result<Unit> = try {
        apiService.removeVehicle(vehicleId)
        Result.success(Unit)
    }catch (e: Exception){
        Result.failure(e)
    }

    suspend fun uploadVehicleImage(vehicleId: String, imagePart: MultipartBody.Part): Result<VehicleDto> = try {
        val response = apiService.uploadVehicleImage(vehicleId, imagePart)
        Result.success(VehicleDto(vehicleId=vehicleId, imageUrl = response.data.imageUrl))
    }catch (e: HttpException){
        val error = ApiErrorParser.parse(e)
        Result.failure(ApiException(error.error, error.message ?: "Failed to upload vehicle image"))
    }catch (e: Exception){
        Result.failure(e)
    }
    
    suspend fun getFuelAnalytics(): Result<FuelAnalyticsDto> = try{
        Result.success(apiService.getFuelAnalytics())
    }
    catch(e: HttpException){
        val error = ApiErrorParser.parse(e)
        Result.failure(ApiException(error.error, error.message ?: "Failed to fetch fuel analytics."))
    }
    catch( e: Exception){
        Result.failure(e)
    }

}