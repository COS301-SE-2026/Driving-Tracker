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

@HiltViewModel
class VehiclesViewModel @Inject constructor(
    private val repository: VehicleRepository
): ViewModel(){
    private val _uiState = MutableStateFlow<UiState>(UiState.Loading)
    val uiState = _uiState.asStateFlow()

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

    fun addVehicle(name: String, reg: String?, make: String, model: String, year: Int, fuel: String){
        viewModelScope.launch{
            val req = AssignVehicleRequest(name, reg, make, model, year, fuel)
            repository.addVehicle(req).onSuccess {
                loadVehicles()
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

    sealed class UiState{
        object Loading: UiState()
        data class Success(val vehicles: List<VehicleDto>) : UiState()
        data class Error(val message: String) : UiState()
    }
}