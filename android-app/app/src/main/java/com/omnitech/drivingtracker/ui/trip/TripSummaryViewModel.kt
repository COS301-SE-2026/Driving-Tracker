package com.omnitech.drivingtracker.ui.trip

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.omnitech.drivingtracker.data.api.ApiException
import com.omnitech.drivingtracker.data.models.LocationDto
import com.omnitech.drivingtracker.data.models.TripSummaryDto
import com.omnitech.drivingtracker.data.repository.TripRepository
import com.omnitech.drivingtracker.data.sensors.SensorFusionManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.time.Instant
import javax.inject.Inject

@HiltViewModel
class TripSummaryViewModel @Inject constructor(private val repository: TripRepository, private val sensorFusionManager: SensorFusionManager) : ViewModel() {
    sealed class UiState {
        object Idle : UiState()
        object Loading : UiState()
        data class Success(
            val trip: TripSummaryDto,
            val isFirstTrip: Boolean = false
        ) : UiState()
        data class Error(val code: String? = null, val message: String? = null) : UiState()
    }

    val liveMetrics = sensorFusionManager.liveMetrics

    private val _uiState = MutableStateFlow<UiState>(UiState.Idle)
    val uiState: StateFlow<UiState> = _uiState

    private val _endTripState = MutableStateFlow<UiState>(UiState.Idle)
    val endTripState: StateFlow<UiState> = _endTripState

    private val _mapToken = MutableStateFlow<String?>(null)
    val mapTokenState: StateFlow<String?> = _mapToken

    fun fetchMapToken() {
        viewModelScope.launch {
            repository.getMapToken().onSuccess { data ->
                _mapToken.value = data.token
            }.onFailure {
                _mapToken.value = null
            }
        }
    }
    private val _plannedRoute = MutableStateFlow<List<LocationDto>?>(null)
    val plannedRoute: StateFlow<List<LocationDto>?> = _plannedRoute

    fun suggestedRoute(startLat: Double?, startLng: Double?, destLat: Double, destLng: Double) {
        viewModelScope.launch {
            try {
                val response = repository.getSuggestedRoute(
                    LocationDto(startLat, startLng),
                    LocationDto(destLat, destLng)
                )
                _plannedRoute.value = response.getOrNull()?.points
            } catch (e: Exception) {
                Log.e("TripSummaryVM", "Route fetch failed: ${e.message}")
            }
        }
    }

    fun loadTripSummary(tripId: String) {
        viewModelScope.launch {
            _uiState.value = UiState.Loading
            repository.getTripSummary(tripId).fold(
                onSuccess = { trip ->
                    _uiState.value = UiState.Success(trip)
                },
                onFailure = { exception ->
                    when (exception) {
                        is ApiException -> {
                            _uiState.value = UiState.Error(
                                code = exception.errorCode,
                                message = exception.errorMessage ?: "Failed to load trip"
                            )
                        }
                        else -> {
                            _uiState.value = UiState.Error(
                                message = exception.message ?: "Unknown error"
                            )
                        }
                    }
                }
            )
        }
    }

    fun endTrip(tripId: String,latitude: Double?, longitude: Double?,distance: Double?,durationMinutes: Int?,fuelEstimate: Double?) {
        viewModelScope.launch {
            _endTripState.value = UiState.Loading
            
            val endTime = Instant.now().toString()
            val status = "COMPLETED"


            repository.endTrip(
                tripId = tripId,
                endTime = endTime,
                status = status,
                distanceKm = distance,
                durationMinutes = durationMinutes,
                fuelEstimate = fuelEstimate,
                endLocation = if (latitude != null && longitude != null) {
                    LocationDto(lat = latitude, lng = longitude)
                } else null,

            ).fold(
                onSuccess = { data ->
                    _endTripState.value = UiState.Success(
                        trip = TripSummaryDto(
                            tripId = tripId,
                            vehicleId = null,
                            startedAt = "",
                            endedAt = endTime,
                            status = status,
                            dataSource = null,
                            routePolyline = null,
                            distanceKm = distance,
                            durationMinutes = durationMinutes,
                            fuelEstimate = fuelEstimate,
                            scores = null,
                            events = emptyList()
                        ),
                        isFirstTrip = data.isFirstTrip ?: false
                    )
                },
                onFailure = { exception ->
                    val errorMessage = if (exception is ApiException) {
                        exception.errorMessage ?: "Failed to end trip"
                    } else {
                        exception.message ?: "Unknown error"
                    }
                    _endTripState.value = UiState.Error(message = errorMessage)
                }
            )
        }
    }
}
