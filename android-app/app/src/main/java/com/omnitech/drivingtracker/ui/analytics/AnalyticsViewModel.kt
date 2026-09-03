package com.omnitech.drivingtracker.ui.analytics
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.omnitech.drivingtracker.data.repository.TripRepository
import com.omnitech.drivingtracker.data.repository.VehicleRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject
import kotlin.math.roundToInt
import kotlin.time.Clock
import kotlin.time.Instant

data class AnalyticsUiState(
    val isLoading: Boolean = true,
    val drivingScore: Int? = null,
    val safetyScore: Int? = null,
    val ecoScore: Int? = null,
    val fuelEfficiency: Double? = null,
    val totalDistanceKm: Double? = null,
    val tripCount: Int? = null,
    val totalMinutes: Int? = null,
    val eventCount: Int? = null,
    val history: List<TripDataPoint> = emptyList(),
    val safetyHistory: List<Float> = emptyList(),
    val ecoHistory: List<Float> = emptyList(),
    val eventHistory: List<Int> = emptyList(),
    val accelerationEvents: Int = 0,
    val brakingEvents: Int = 0,
    val error: String? = null
)

@HiltViewModel
class AnalyticsViewModel @Inject constructor(
    private val tripRepo: TripRepository,
    private val vehicleRepo: VehicleRepository
) : ViewModel(){
    private val _uiState = MutableStateFlow(AnalyticsUiState())
    val uiState: StateFlow<AnalyticsUiState> = _uiState.asStateFlow()

    init {load()}

    fun load(){
        viewModelScope.launch{

            _uiState.value = _uiState.value.copy(isLoading = true, error = null)

            //fetching ALL trips from the app
            tripRepo.getTripHistory(
                startDate = Instant.fromEpochMilliseconds(0).toString(),
                endDate = Clock.System.now().toString(),
                status = "COMPLETED"
            ).fold(
                onSuccess = {

                    data->
                    val trips = data.trips
                    val scores = trips.mapNotNull{it.trip_scores?.firstOrNull()}
                    val avgSafety = scores.mapNotNull { it.safetyScore }.averageOrNull()?.roundToInt()
                    val avgEco = scores.mapNotNull { it.ecoScore }.averageOrNull()?.roundToInt()
                    val avgOverall = scores.mapNotNull { it.overallScore }.averageOrNull()?.roundToInt()
                    val totalDistance = trips.mapNotNull { it.distanceKm }.sum()
                    val totalMinutes = trips.mapNotNull { it.durationMinutes }.sum()
                    val tripCount = data.totalTrips ?:trips.size

                    coroutineScope{
                        val summaries = trips.map{
                            trip->
                            async {tripRepo.getTripSummary(trip.tripId).getOrNull()}
                        }.awaitAll().filterNotNull()

                        val events = summaries.flatMap {it.events}
                        val totalEvents = events.size
                        val accelerationEvents = events.count { it.eventType == "HARSH_ACCELERATION"}
                        val brakingEvents = events.count {it.eventType == "HARSH_BRAKE"}
                        val eventHistory = trips.map {trip ->
                            summaries.firstOrNull {it.tripId == trip.tripId}?.events?.size ?: 0
                        }

                    vehicleRepo.getFuelAnalytics().fold(
                        onSuccess = {
                                fuelData ->
                            val fuelByDate = fuelData.history.associateBy {
                                it.date.take(10)
                            }
                            val history = trips.map{
                                    trip->
                                val score = trip.trip_scores?.firstOrNull()
                                val date = (trip.endTime ?: trip.startTime).take(10)

                                TripDataPoint(
                                    date = date,
                                    fuelEfficiency = fuelByDate[date]?.efficiencyLPer100Km,
                                    ecoScore = score?.ecoScore?.roundToInt(),
                                    safetyScore = score?.safetyScore?.roundToInt(),
                                    eventCount = summaries.firstOrNull {it.tripId == trip.tripId}
                                        ?.events?.size ?: 0
                                )
                            }
                            _uiState.value = AnalyticsUiState(
                                isLoading = false,
                                drivingScore = avgOverall,
                                safetyScore = avgSafety,
                                ecoScore = avgEco,
                                fuelEfficiency = fuelData.averageFuelEfficiency,
                                totalDistanceKm = totalDistance,
                                tripCount = tripCount,
                                totalMinutes = totalMinutes,
                                eventCount = totalEvents,
                                history = history,
                                safetyHistory = history.mapNotNull {it.safetyScore?.toFloat()},
                                ecoHistory = history.mapNotNull {it.ecoScore?.toFloat()},
                                eventHistory = eventHistory,
                                accelerationEvents = accelerationEvents,
                                brakingEvents = brakingEvents
                            )
                        },
                    onFailure = {
                        exception ->
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            drivingScore = avgOverall,
                            safetyScore = avgSafety,
                            ecoScore = avgEco,
                            totalDistanceKm = totalDistance,
                            tripCount = tripCount,
                            totalMinutes = totalMinutes,
                            eventCount = totalEvents,
                            eventHistory = eventHistory,
                            accelerationEvents = accelerationEvents,
                            brakingEvents = brakingEvents,
                            error = exception.message
                        )
                    }
            )
        }
},
                onFailure = {
                exception->_uiState.value = _uiState.value.copy(isLoading = false, error = exception.message)
                }
            )
        }
    }
}

fun List<Double>.averageOrNull():Double? = if (isEmpty()){
    null
}else{
    average()
}