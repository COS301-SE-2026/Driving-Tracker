package com.omnitech.drivingtracker.ui.trip

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.omnitech.drivingtracker.data.api.ApiException
import com.omnitech.drivingtracker.data.models.LocationDto
import com.omnitech.drivingtracker.data.models.TripSummaryDto
import com.omnitech.drivingtracker.data.obd.ObdManager
import com.omnitech.drivingtracker.data.repository.TripRepository
import com.omnitech.drivingtracker.data.repository.TripStateManager
import com.omnitech.drivingtracker.data.sensors.SensorFusionManager
import com.omnitech.drivingtracker.services.NotificationHelper
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.time.Instant
import javax.inject.Inject
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.stateIn
import com.omnitech.drivingtracker.data.models.GeoJsonLineString

@HiltViewModel
class TripSummaryViewModel @Inject constructor(
    private val repository: TripRepository,
    private val sensorFusionManager: SensorFusionManager,
    private val tripStateManager: TripStateManager,
    private val obdManager: ObdManager,
    private val notificationHelper: NotificationHelper
) : ViewModel() {
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

    private val _tripPath = MutableStateFlow<List<LocationDto>>(emptyList())
    val tripPath: StateFlow<List<LocationDto>> = _tripPath

    val nearbyPois = tripStateManager.nearbyPois

    val safetyCheck = tripStateManager.safetyCheck

    fun clearSafetyCheck() = tripStateManager.clearSafetyCheck()

    fun loadTripPath(tripId: String) {
        viewModelScope.launch {
            val readings = repository.getTripReadings(tripId)
            _tripPath.value = readings.map { LocationDto(it.latitude, it.longitude) }
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
    private val _plannedRoute = MutableStateFlow<List<LocationDto>?>(null)
    val plannedRoute: StateFlow<List<LocationDto>?> = _plannedRoute

    private val _detourRoute = MutableStateFlow<List<LocationDto>?>(null)
    val detourRoute: StateFlow<List<LocationDto>?> = _detourRoute

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

    fun fetchDetourRoute(startLat: Double?, startLng: Double?, destLat: Double, destLng: Double) {

        Log.d("TripSummaryVM", "Attempting detour fetch: From $startLat, $startLng to $destLat, $destLng")
        viewModelScope.launch {
            try {

                _detourRoute.value = null

                val response = repository.getSuggestedRoute(
                    LocationDto(startLat, startLng),
                    LocationDto(destLat, destLng)
                )
                _detourRoute.value = response.getOrNull()?.points
            } catch (e: Exception) {
                Log.e("TripSummaryVM", "Detour Route fetch failed: ${e.message}")
                _detourRoute.value = null
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

    private val _observedTripId = MutableStateFlow<String?>(null)

    @OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)
    val localEvents = _observedTripId.flatMapLatest{id ->
        if(id == null) kotlinx.coroutines.flow.flowOf(emptyList())
        else repository.getLocalEventsFlow(id)
    }.stateIn(viewModelScope, kotlinx.coroutines.flow.SharingStarted.WhileSubscribed(5000), emptyList()
    )
    fun observeTripEvents(tripId: String){
        _observedTripId.value = tripId
    }

    fun endTrip(tripId: String,latitude: Double?, longitude: Double?,distance: Double?,durationMinutes: Int?,fuelEstimate: Double?,fuelLevelEnd:Float?,path: List<LocationDto>) {
        viewModelScope.launch {
            _endTripState.value = UiState.Loading
            val geoJson = GeoJsonLineString(
                coordinates = path.mapNotNull { loc ->
                    if (loc.lat != null && loc.lng != null) listOf(loc.lng, loc.lat) else null
                }
            )
            val endTime = Instant.now().toString()
            val status = "COMPLETED"
            var currentFuel = obdManager.metrics.value.fuelLevel;
            if(currentFuel == null || currentFuel == 0f){
                currentFuel = fuelLevelEnd
            }



            repository.endTrip(
                tripId = tripId,
                endTime = endTime,
                status = status,
                distanceKm = distance,
                durationMinutes = durationMinutes,
                fuelEstimate = fuelEstimate,
                fuelLevelEnd = currentFuel,
                routePolyline = geoJson,
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

    fun confirmStopEvent(eventId: String) {
        viewModelScope.launch {

            repository.confirmStopEvent(eventId).fold(
                onSuccess = {
                    notificationHelper.showGeneralNotification("Contacts Alerted", "Your trusted contacts have been notified of your stop.")
                    tripStateManager.clearSafetyCheck()
                },
                onFailure = { exception ->
                    when (exception) {
                        is ApiException -> {
                            _uiState.value = UiState.Error(
                                code = exception.errorCode,
                                message = exception.errorMessage ?: "Failed to confirm stop"
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

    fun resolveStopEvent(eventId: String, reason: String) {
        viewModelScope.launch {

            repository.resolveStopEvent(eventId, reason).fold(
                onSuccess = {
                    tripStateManager.clearSafetyCheck()
                    Log.d("Stop", "Resolved stop event")
                },
                onFailure = { exception ->
                    when (exception) {
                        is ApiException -> {
                            _uiState.value = UiState.Error(
                                code = exception.errorCode,
                                message = exception.errorMessage ?: "Failed to confirm stop"
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
}
