package com.omnitech.drivingtracker.ui.vehicles

import androidx.lifecycle.ViewModel
import com.omnitech.drivingtracker.data.repository.VehicleRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import androidx.lifecycle.viewModelScope
import com.omnitech.drivingtracker.data.models.AssignVehicleRequest
import kotlinx.coroutines.launch
import com.omnitech.drivingtracker.data.models.VehicleDto
import dagger.hilt.android.qualifiers.ApplicationContext
import android.content.Context
import android.net.Uri
import com.omnitech.drivingtracker.data.api.ApiException
import com.omnitech.drivingtracker.utils.ImageUploadUtils

@HiltViewModel
class VehiclesViewModel @Inject constructor(
    private val repository: VehicleRepository,
    @ApplicationContext private val context: Context
): ViewModel(){
    private val _uiState = MutableStateFlow<UiState>(UiState.Loading)
    val uiState = _uiState.asStateFlow()

    private val _warningState = MutableStateFlow("")
    val warningState = _warningState.asStateFlow()

    fun resetWarning(){
        _warningState.value = ""
    }

    init{
        loadVehicles()
    }

    fun loadVehicles(){
        viewModelScope.launch{
            _uiState.value = UiState.Loading
            repository.getVehicles().fold(
                onSuccess = { _uiState.value = UiState.Success(it)},
                onFailure = { _uiState.value = UiState.Error(it.message?: "Unknown error")}
            )
        }
    }

    fun addVehicle(name: String, reg: String?, make: String, model: String, year: Int, fuel: String, fuelTank: Float?, imageUri: Uri? = null){
        viewModelScope.launch{
            if(fuelTank == null){
                _uiState.value = UiState.Error("Your vehicle tank size is invalid")
                return@launch
            }

            val req = AssignVehicleRequest(name, reg, make, model, year, fuel, fuelTank)
            repository.addVehicle(req).fold(
                onSuccess = { vehicleResponse ->

                    vehicleResponse.warning?.let{ _warningState.value = it }

                    if(imageUri != null){
                        uploadVehicleImage(vehicleResponse.data.vehicleId, imageUri)
                    }else{
                        loadVehicles()
                    }
                },
                onFailure = { exception ->
                    val message = when (exception){
                        is ApiException -> exception.errorMessage ?: "Failed to add vehicle"
                        else -> exception.message ?: "Failed to add vehicle"
                    }
                    _uiState.value = UiState.Error(message)
                }
            )
        }
    }

    fun uploadVehicleImage(vehicleId: String, uri: Uri){
        viewModelScope.launch{
            try{
                val part = ImageUploadUtils.uriToMultipart(context, uri, "image")
                repository.uploadVehicleImage(vehicleId, part).fold(
                    onSuccess = { loadVehicles() },
                    onFailure = { exception ->
                        val message = when (exception) {
                            is ApiException -> exception.errorMessage ?: "Failed to upload vehicle image"
                            else -> exception.message ?: "Failed to upload vehicle image"
                        }
                        _uiState.value = UiState.Error(message)
                    }
                )
            }catch (e: IllegalArgumentException){
                _uiState.value = UiState.Error(e.message ?: "Invalid image")
            }
        }
    }

    fun updateVehicleName(vehicleId: String, newName: String){
        viewModelScope.launch{
            repository.updateVehicleName(vehicleId, newName).fold(
                onSuccess = {
                    loadVehicles()
                },
                onFailure = {exception ->
                    _uiState.value = UiState.Error(exception.message ?: "Failed to update name")
                }
            )
        }
    }

    fun removeVehicle(vehicleId: String){
        viewModelScope.launch{
            repository.removeVehicle(vehicleId).fold(
                onSuccess = {
                    loadVehicles()
                },
                onFailure = {exception ->
                    _uiState.value = UiState.Error(exception.message ?: "Failed to delete vehicle")
                }
            )
        }
    }

    sealed class UiState{
        object Loading: UiState()
        data class Success(val vehicles: List<VehicleDto>) : UiState()
        data class Error(val message: String) : UiState()
    }
}