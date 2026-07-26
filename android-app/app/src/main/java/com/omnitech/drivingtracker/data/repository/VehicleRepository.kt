package com.omnitech.drivingtracker.data.repository

import com.omnitech.drivingtracker.data.api.ApiErrorParser
import com.omnitech.drivingtracker.data.api.ApiException
import com.omnitech.drivingtracker.data.models.AssignVehicleRequest
import com.omnitech.drivingtracker.data.models.UpdateVehicleNameRequest
import com.omnitech.drivingtracker.services.ApiService
import javax.inject.Inject
import com.omnitech.drivingtracker.data.models.VehicleDto
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

    suspend fun addVehicle(req: AssignVehicleRequest) : Result<VehicleDto> = try {
        val response = apiService.assignVehicle(req)
        Result.success(response.data)
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
}