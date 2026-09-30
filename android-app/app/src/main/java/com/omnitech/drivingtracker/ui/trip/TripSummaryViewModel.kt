package com.omnitech.drivingtracker.ui.trip

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.omnitech.drivingtracker.data.api.ApiException
import com.omnitech.drivingtracker.data.models.GeoJsonLineString
import com.omnitech.drivingtracker.data.models.LocationDto
import com.omnitech.drivingtracker.data.models.TripEventDto
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
import kotlin.collections.emptyList
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.flowOf


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
            val trip: TripSummaryDto
        ) : UiState()
        object EndTripSuccess : UiState()
        data class Error(val code: String? = null, val message: String? = null) : UiState()
    }

    val liveMetrics = sensorFusionManager.liveMetrics

    private val _uiState = MutableStateFlow<UiState>(UiState.Idle)
    val uiState: StateFlow<UiState> = _uiState

    private val _endTripState = MutableStateFlow<UiState>(UiState.Idle)
    val endTripState: StateFlow<UiState> = _endTripState

    private val _mapToken = MutableStateFlow<String?>(null)
    val mapTokenState: StateFlow<String?> = _mapToken

    private val _globalHotspots = MutableStateFlow<List<TripEventDto>>(emptyList())
    private val _tripPath = MutableStateFlow<List<LocationDto>>(emptyList())

    val nearbyPois = tripStateManager.nearbyPois

    val safetyCheck = tripStateManager.safetyCheck

    val nearbyPotholes = tripStateManager.nearbyPotholes

    fun clearSafetyCheck() = tripStateManager.clearSafetyCheck()

    val globalHotspots: StateFlow<List<TripEventDto>> = _globalHotspots

    fun loadGlobalHotspots(){
        viewModelScope.launch {
            repository.getGlobalHotspots().onSuccess {
                _globalHotspots.value = it
            }
        }
    }
    fun checkAndNotifyHotspot(eventId: String): Boolean {
        return tripStateManager.markHotspotNotified(eventId)
    }
    fun clearDetour() {
        _detourRoute.value = null
        tripStateManager.clearDetour()
    }

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
            }.onFailure { exception ->
                Log.e("TripSummaryVM", "Failed to fetch map token: ${exception.message}")
                _mapToken.value = ""
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

                repository.getSuggestedRoute(
                    LocationDto(startLat, startLng),
                    LocationDto(destLat, destLng)
                ).onSuccess { data ->
                    _plannedRoute.value = data.points

                    tripStateManager.setExpectedTravelTime(data.travelTimeSeconds)
                }

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

                repository.getSuggestedRoute(
                    LocationDto(startLat, startLng),
                    LocationDto(destLat, destLng)
                ).onSuccess { data ->
                    _detourRoute.value = data.points
                    tripStateManager.setDetourTime(data.travelTimeSeconds)
                }

            } catch (e: Exception) {
                Log.e("TripSummaryVM", "Detour Route fetch failed: ${e.message}")
                _detourRoute.value = null
            }
        }
    }
    fun resetEndTripState() {
        _endTripState.value = UiState.Idle
    }
    fun loadTripSummary(tripId: String) {
        viewModelScope.launch {
            _uiState.value = UiState.Loading
            repository.getTripSummary(tripId).fold(
                onSuccess = { trip ->
                    _uiState.value = UiState.Success(trip)

                    val savedPolyline = trip.routePolyline?.coordinates
                    if(!savedPolyline.isNullOrEmpty()){
                        val points = savedPolyline.mapNotNull{ coord ->
                            if(coord.size >= 2) LocationDto(lat = coord[1], lng = coord[0]) else null
                        }
                        _plannedRoute.value = points
                    }
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
    val tripPath: StateFlow<List<LocationDto>> = _observedTripId.flatMapLatest { id ->
        if(id == null) flowOf(emptyList())
        else repository.getTripReadingsFlow(id).map { readings ->
            readings.map{ LocationDto(it.latitude, it.longitude) }
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

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
            val localReadings = repository.getTripReadings(tripId)
            val fullPath = if (localReadings.isNotEmpty()){
                localReadings.map { LocationDto(it.latitude, it.longitude) }
            }else{
                path
            }

            var calculatedDistance = 0.0
            for(i in 0 until fullPath.size - 1){
                val p1 = fullPath[i]
                val p2 = fullPath[i+1]
                if(p1.lat != null && p1.lng != null && p2.lat != null && p2.lng != null){
                    val results = FloatArray(1)
                    android.location.Location.distanceBetween(p1.lat, p1.lng, p2.lat, p2.lng, results)
                    calculatedDistance += results[0]
                }
            }

            val actualDistanceKm = if(calculatedDistance > 0){
                calculatedDistance / 1000.0
            }else{
                distance ?: 0.0
            }

            val geoJson = GeoJsonLineString(
                coordinates = fullPath.mapNotNull { loc ->
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
                distanceKm = actualDistanceKm,
                durationMinutes = durationMinutes,
                fuelEstimate = fuelEstimate,
                fuelLevelEnd = currentFuel,
                routePolyline = geoJson,
                endLocation = if (latitude != null && longitude != null) {
                    LocationDto(lat = latitude, lng = longitude)
                } else null,

            ).fold(
                onSuccess = {
                    _endTripState.value = UiState.EndTripSuccess
                },
                onFailure = { exception ->
                    val errorMessage = if (exception is ApiException) {
                        exception.errorMessage ?: "Failed to end trip"
                    } else {
                        exception.message ?: "Unknown error"
                    }

                    Log.e("LiveTripError", errorMessage)

                    if((exception is ApiException) && exception.errorCode == "TRIP_ALREADY_COMPLETED"){
                        _endTripState.value = UiState.EndTripSuccess
                    }else {
                        _endTripState.value = UiState.Error(message = errorMessage)
                    }
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
