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
import com.omnitech.drivingtracker.data.db.entities.TripReadingEntity
import com.omnitech.drivingtracker.data.models.LocationDto
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

    private val _tripPath = MutableStateFlow<List<LocationDto>>(emptyList())
    val tripPath =_tripPath.asStateFlow()

    private val _plannedRoute = MutableStateFlow<List<LocationDto>?>(null)
    val plannedRoute = _plannedRoute.asStateFlow()
    private val _actualRoute = MutableStateFlow<List<LocationDto>?>(null)
    val actualRoute = _actualRoute.asStateFlow()


    fun startPolling(tripId: String){
        viewModelScope.launch {
            while(isActive){
                try {
                    val result = api.getLatestLocation(tripId)
                    val locData = result.data
                    _uiState.update { it.copy(location = locData, isLoading = false) }

                    val recordedAt = try {
                        java.time.Instant.parse(locData.lastRecordedAt).toEpochMilli()
                    } catch (e: Exception) {
                        System.currentTimeMillis()
                    }
                    val readingEntity = TripReadingEntity(
                        tripId = tripId,
                        recordedAt = recordedAt,
                        latitude = locData.lastLatitude,
                        longitude = locData.lastLongitude,
                        speedKmh = locData.lastSpeedKmh.toFloat(),
                        dataSource = "SHARED",
                        accelerometer = null,
                        gyroscopeX = null,
                        gyroscopeY = null,
                        gyroscopeZ = null,
                        rpm = null,
                        coolantTemp = null,
                        fuelTrimPercent = null,
                        throttlePosition = null,
                        dtcCodes = null,
                        synced = true
                    )
                    repository.saveReadingLocally(readingEntity)
//                    val startLat = _uiState.value.tripData?.startLatitude
//                    val startLng = _uiState.value.tripData?.startLongitude

                    // Append the new live location to the driven path
                    val newPoint = LocationDto(locData.lastLatitude, locData.lastLongitude)
                    _tripPath.update { currentPath ->
                        if (currentPath.lastOrNull() != newPoint) {
                            currentPath + newPoint
                        } else {
                            currentPath
                        }
                    }

                    if (locData.status == "COMPLETED") break
                }
//                } catch(e: HttpException){
//                    val error = ApiErrorParser.parse(e)
//                    if(error.error === "UNAUTHORIZED"){
//                        _uiState.update { it.copy(isAccessRevoked = true, isLoading = false) }
//                    }
//                    break
//                }
                catch(e: Exception){
                    Log.d("LiveTripContact", "Failed to start polling: ${e.message}")
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
                    repository.getTripSummary(tripId).onSuccess { summary ->
                        _tripPath.value = summary.events.map {
                            LocationDto( it.latitude,it.longitude)
                        }
                        if (summary.destinationLatitude != null && summary.destinationLongitude != null) {
                            fetchSuggestedRoute(
                                specificTrip?.startLatitude ?: summary.events.firstOrNull()?.latitude ?: 0.0,
                                specificTrip?.startLongitude ?: summary.events.firstOrNull()?.longitude ?: 0.0,
                                summary.destinationLatitude,
                                summary.destinationLongitude
                            )
                        }
                    }
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
    private fun fetchSuggestedRoute(startLat: Double, startLng: Double, destLat: Double, destLng: Double) {
        viewModelScope.launch {
            repository.getSuggestedRoute(
                LocationDto(startLat, startLng),
                LocationDto(destLat, destLng)
            ).onSuccess { data -> _plannedRoute.value = data.points }
        }
    }
}