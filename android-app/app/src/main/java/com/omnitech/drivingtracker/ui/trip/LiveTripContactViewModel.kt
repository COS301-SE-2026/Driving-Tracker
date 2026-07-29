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
import com.omnitech.drivingtracker.data.repository.TripRepository
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
class LiveTripContactViewModel @Inject constructor(
    private val api: ApiService,
    private val notificationRepository: NotificationsRepository,
    private val repository: TripRepository
) : ViewModel() {

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

    private val _mapToken = MutableStateFlow<String?>(null)
    val mapTokenState: StateFlow<String?> = _mapToken

    private val _distanceKm = MutableStateFlow(0.0)
    val distanceKm: StateFlow<Double> = _distanceKm


    fun startPolling(tripId: String){
        viewModelScope.launch {
            while(isActive){
                try{
                    val result = api.getLatestLocation(tripId)
                    val locData = result.data
                    _uiState.update  { it.copy(location = locData, isLoading = false) }

                    val startLat = _uiState.value.tripData?.startLatitude
                    val startLng = _uiState.value.tripData?.startLongitude

                    if(startLat != null && startLng != null){
                        val results = FloatArray(1)
                        android.location.Location.distanceBetween(
                            startLat,
                            startLng,
                            locData.lastLatitude,
                            locData.lastLongitude,
                            results
                        )

                        _distanceKm.value = results[0] / 1000.0
                    }

                    if(locData.status == "COMPLETED") break

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

                    repository.getMapToken().onSuccess { data ->
                        _mapToken.value = data.token
                    }
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

    fun fetchMapToken() {
        viewModelScope.launch {
            repository.getMapToken().onSuccess { data ->
                _mapToken.value = data.token
            }.onFailure {
                _mapToken.value = null
            }
        }
    }
}