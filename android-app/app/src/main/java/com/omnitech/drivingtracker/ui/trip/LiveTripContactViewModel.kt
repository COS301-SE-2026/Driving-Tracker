package com.omnitech.drivingtracker.ui.trip

import android.util.Log
import androidx.lifecycle.ViewModel
import com.omnitech.drivingtracker.data.models.LatestLocationData
import com.omnitech.drivingtracker.ui.trip.TripSummaryViewModel.UiState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import javax.inject.Inject
import androidx.lifecycle.viewModelScope
import com.omnitech.drivingtracker.data.api.ApiErrorParser
import com.omnitech.drivingtracker.data.api.ApiException
import com.omnitech.drivingtracker.data.models.SharedWithMeData
import com.omnitech.drivingtracker.data.models.SharedWithMeDto
import com.omnitech.drivingtracker.data.repository.NotificationsRepository
import com.omnitech.drivingtracker.services.ApiService
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import retrofit2.HttpException
import java.time.Instant
import java.time.Duration

@HiltViewModel
class LiveTripContactViewModel @Inject constructor(private val api: ApiService, private val notificationRepository: NotificationsRepository) : ViewModel() {

    data class UiState(
        val tripData: SharedWithMeDto? = null,
        val location: LatestLocationData? = null,
        val isLoading: Boolean = false,
        val error: String? = null,
        val isAccessRevoked: Boolean = false
    )

    private val _uiState = MutableStateFlow(UiState())
    val uiState = _uiState.asStateFlow()

    private val _durationMinutes = MutableStateFlow(0L)
    val durationMinutes: StateFlow<Long> = _durationMinutes

    fun startPolling(tripId: String){
        viewModelScope.launch {
            while(isActive){
                try{
                    val result = api.getLatestLocation(tripId)
                    _uiState.update  { it.copy(location = result.data, isLoading = false) }
                    if(result.data.status == "COMPLETED") break

                } catch(e: HttpException){
                    val error = ApiErrorParser.parse(e)
                    if(error.error === "UNAUTHORIZED"){
                        _uiState.update { it.copy(isAccessRevoked = true, isLoading = false) }
                    }
                    break
                } catch(e: Exception){
                    Log.d("LiveTripContact", "Failed to start polling")
                }
                delay(5_000)
            }
        }
    }

    fun loadTripInfo(tripId: String){
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }

            notificationRepository.getTripsSharedWithMe().fold(
                onSuccess = { allTrips ->
                    val specificTrip = allTrips.find { it.tripId == tripId }
                    _uiState.update { it.copy(tripData = specificTrip, isLoading = false) }

                },
                onFailure = {
                    _uiState.update { it.copy(isLoading = false, error = "Failed to load trip info") }
                }
            )
        }
    }

    fun calculateDuration(startedAt: String): Long{
        val start = Instant.parse(startedAt)
        val now = Instant.now()

        return Duration.between(start, now).toMinutes()
    }

    fun startDurationTimer(startedAt: String){
        viewModelScope.launch {
            while(isActive){
                _durationMinutes.value = calculateDuration(startedAt)
                delay(60_000)
            }
        }
    }
}