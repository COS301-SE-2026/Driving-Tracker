package com.omnitech.drivingtracker.ui.trip

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.omnitech.drivingtracker.data.api.ApiException
import com.omnitech.drivingtracker.data.models.AddressSearchResult
import com.omnitech.drivingtracker.data.models.ContactDto
import com.omnitech.drivingtracker.data.models.LiveSensorMetrics
import com.omnitech.drivingtracker.data.obd.ObdManager
import com.omnitech.drivingtracker.data.repository.ContactsRepository
import com.omnitech.drivingtracker.data.repository.TripRepository
import com.omnitech.drivingtracker.data.sensors.SensorFusionManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class TripViewModel @Inject constructor(
    private val tripRepository: TripRepository,
    private val contactsRepository: ContactsRepository,
    private val sensorFusion: SensorFusionManager,
    private val obdManager: ObdManager
) : ViewModel(){

    sealed class UiState{
        object Idle : UiState()
        object Loading : UiState()
        data class Success(val data: String = "") : UiState() // trip_id or context data
        data class SuccessApprovedContacts(val data: List<ContactDto>): UiState()
        data class SuccessVehicles(val vehicles: List<com.omnitech.drivingtracker.data.models.VehicleDto>) : UiState()
        data class Error(
            val code: String? = null,
            val message: String? = null
        ) : UiState()
        data class SuccessSuggestions(val suggestions: List<AddressSearchResult>) : UiState()
    }

    val unknownErrorVal = "Unknown error"
    val liveMetrics: StateFlow<LiveSensorMetrics> = sensorFusion.liveMetrics
    private val _approvedContactsState = MutableStateFlow<UiState>(UiState.Idle)
    val approvedContactsState : StateFlow<UiState> = _approvedContactsState

    private val _tripStartState = MutableStateFlow<UiState>(UiState.Idle)
    val tripStartState: StateFlow<UiState> = _tripStartState

    private val _vehiclesState = MutableStateFlow<UiState>(UiState.Idle)
    val vehiclesState: StateFlow<UiState> = _vehiclesState

    private val _suggestionsState = MutableStateFlow<UiState>(UiState.Idle)
    val suggestionsState: StateFlow<UiState> = _suggestionsState

    init{
        loadApprovedContacts()
        loadVehicles()
    }
    fun searchAddress(query: String){
        if (query.isBlank()) {
            _suggestionsState.value = UiState.Idle
            return
        }
        viewModelScope.launch {
            _suggestionsState.value = UiState.Loading
            tripRepository.searchAddress(query).fold(
                onSuccess = { suggestions ->
                    Log.d("Geocoding", "Translated '$query' to ${suggestions.size} results")
                    suggestions.forEach {
                        Log.d("Geocoding", " - ${it.address}: (${it.latitude}, ${it.longitude})")
                    }
                    _suggestionsState.value = UiState.SuccessSuggestions(suggestions)
                },
                onFailure = { exception ->
                    Log.e("Geocoding", "Search failed for '$query': ${exception.message}")
                    _suggestionsState.value = UiState.Error(message = exception.message)
                }
            )
        }
    }

    fun loadVehicles() {
        viewModelScope.launch {
            _vehiclesState.value = UiState.Loading
            
            tripRepository.getVehicles().fold(
                onSuccess = { vehicles ->
                    _vehiclesState.value = UiState.SuccessVehicles(vehicles)
                },
                onFailure = { exception ->
                    when (exception) {
                        is ApiException -> {
                            _vehiclesState.value = UiState.Error(
                                code = exception.errorCode,
                                message = exception.errorMessage ?: "Failed to load vehicles"
                            )
                        }
                        else -> {
                            _vehiclesState.value = UiState.Error(
                                message = exception.message ?: unknownErrorVal
                            )
                        }
                    }
                }
            )
        }
    }

    fun loadApprovedContacts(){
        viewModelScope.launch{
            _approvedContactsState.value = UiState.Loading

            contactsRepository.fetchApprovedContacts().fold(
                onSuccess = {contacts ->
                    _approvedContactsState.value = UiState.SuccessApprovedContacts(contacts)
                    Log.d("ApprovedContacts",contacts.toString())
                },
                onFailure = {exception ->
                    when{
                        exception is ApiException -> {
                            _approvedContactsState.value = UiState.Error(
                                code = exception.errorCode,
                                message = exception.errorMessage?: "Failed to load approved contacts"
                            )
                        }
                        else -> {
                            _approvedContactsState.value = UiState.Error(
                                message = exception.message ?: unknownErrorVal
                            )
                        }
                    }
                }
            )
        }
    }

    fun startTrip(
        vehicleId: String,
        dataSource: String,
        latitude: Double,
        longitude: Double,
        destLat: Double? = null,
        destLng: Double? = null,
        fuelLevelStart: Float?,
        selectedContactIds: List<String>?
    ){
        viewModelScope.launch {
            _tripStartState.value = UiState.Loading
            var currentFuel = obdManager.metrics.value.fuelLevel;
            if(currentFuel == null || currentFuel == 0f){
                currentFuel = fuelLevelStart
            }

            tripRepository.startTrip(
                vehicleId = vehicleId,
                dataSource = dataSource,
                latitude = latitude,
                longitude = longitude,
                destLat = destLat,
                destLng = destLng,
                fuelLevelStart = currentFuel,
                selectedContactIds = selectedContactIds
            ).fold(
                onSuccess = { tripId ->
                    _tripStartState.value = UiState.Success(tripId)
                },
                onFailure = { exception ->
                    when {
                        exception is ApiException -> {
                            _tripStartState.value = UiState.Error(
                                code = exception.errorCode,
                                message = exception.errorMessage ?: "Failed to start trip"
                            )
                        }
                        else -> {
                            _tripStartState.value = UiState.Error(
                                message = exception.message ?: unknownErrorVal
                            )
                        }
                    }
                }
            )
        }
    }
}