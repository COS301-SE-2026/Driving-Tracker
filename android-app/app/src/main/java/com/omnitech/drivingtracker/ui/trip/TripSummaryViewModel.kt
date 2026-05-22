package com.omnitech.drivingtracker.ui.trip

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.omnitech.drivingtracker.data.api.ApiException
import com.omnitech.drivingtracker.data.models.TripSummaryDto
import com.omnitech.drivingtracker.data.repository.TripRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.time.Instant

class TripSummaryViewModel(private val repository: TripRepository) : ViewModel() {
    sealed class UiState {
        object Idle : UiState()
        object Loading : UiState()
        data class Success(val trip: TripSummaryDto) : UiState()
        data class Error(val code: String? = null, val message: String? = null) : UiState()
    }

    private val _uiState = MutableStateFlow<UiState>(UiState.Idle)
    val uiState: StateFlow<UiState> = _uiState

    private val _endTripState = MutableStateFlow<UiState>(UiState.Idle)
    val endTripState: StateFlow<UiState> = _endTripState

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

    fun endTrip(tripId: String) {
        viewModelScope.launch {
            _endTripState.value = UiState.Loading
            
            val endTime = Instant.now().toString()
            val status = "COMPLETED"
            val mockDistance = 5.4 
            val mockDuration = 1
            val mockFuel = 7.5
            val mockSafety = 85.0
            val mockEco = 90.0
            val mockOverall = 87.5

            repository.endTrip(
                tripId = tripId,
                endTime = endTime,
                status = status,
                distanceKm = mockDistance,
                durationMinutes = mockDuration,
                fuelEstimate = mockFuel,
                safetyScore = mockSafety,
                ecoScore = mockEco,
                overallScore = mockOverall
            ).fold(
                onSuccess = {
                    _endTripState.value = UiState.Success(
                        TripSummaryDto(
                            tripId = tripId,
                            vehicleId = null,
                            startedAt = "",
                            endedAt = endTime,
                            status = status,
                            dataSource = null,
                            routePolyline = null,
                            distanceKm = mockDistance,
                            durationMinutes = mockDuration,
                            fuelEstimate = mockFuel,
                            scores = null,
                            events = emptyList()
                        )
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
    class TripSummaryViewModelFactory(private val repository: TripRepository) : ViewModelProvider.Factory {
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return TripSummaryViewModel(repository) as T
        }
    }
}