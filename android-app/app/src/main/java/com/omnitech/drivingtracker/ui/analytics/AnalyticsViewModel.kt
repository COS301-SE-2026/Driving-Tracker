package com.omnitech.drivingtracker.ui.analytics
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.omnitech.drivingtracker.data.repository.TripRepository
import com.omnitech.drivingtracker.data.repository.VehicleRepository
import dagger.hilt.android.lifecycle.HiltViewModel
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
                    val totalEvents = trips.sumOf{it.trip_scores?.size ?: 0}

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
                                    eventCount = 0
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
                                history = history
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
                                error = exception.message
                            )
                        }
                    )
                },
                onFailure = {
                    exception ->
                    _uiState.value = _uiState.value.copy(isLoading = false, error = exception.message)
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