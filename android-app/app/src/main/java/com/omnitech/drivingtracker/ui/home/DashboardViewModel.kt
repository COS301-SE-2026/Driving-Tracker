package com.omnitech.drivingtracker.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.omnitech.drivingtracker.data.models.TripItemDto
import com.omnitech.drivingtracker.data.repository.TripRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.temporal.ChronoUnit
import javax.inject.Inject

data class DashboardUiState(
    val overallScore: Int = 0,
    val weeklyDistance: Int = 0,
    val weeklyDistanceChange: Int = 0,
    val weeklyTime: Int = 0,
    val weeklyTimeChange: Int = 0,
    val weeklyTrips: Int = 0,
    val weeklyTripsChange: Int = 0,
    val weeklyFuel: Int = 0,
    val weeklyFuelChange: Int = 0,
    val recentTrip: TripItemDto? = null,
    val isLoading: Boolean = false
)

@HiltViewModel
class DashboardViewModel @Inject constructor(private val repository: TripRepository): ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState

    init {
        fetchDashboardData()
    }

    private fun fetchDashboardData() {
        viewModelScope.launch {

            _uiState.value = _uiState.value.copy(isLoading = true)

            val now = Instant.now()
            val fourteenDaysAgo = now.minus(14, ChronoUnit.DAYS).toString()

            repository.getTripHistory(startDate = fourteenDaysAgo).onSuccess { historyData ->

                val trips = historyData.trips
                val currentWeekStart = now.minus(7, ChronoUnit.DAYS)

                val thisWeekTrips = trips.filter {
                    try { Instant.parse(it.startTime).isAfter(currentWeekStart) } catch(e: Exception) { false }
                }

                val lastWeekTrips = trips.filter {
                    try {
                        val startTime = Instant.parse(it.startTime)
                        startTime.isBefore(currentWeekStart)
                    } catch(e: Exception) { false }
                }

                _uiState.value = calculateStats(thisWeekTrips, lastWeekTrips).copy(
                    recentTrip = trips.firstOrNull(),
                    isLoading = false
                )

            }.onFailure {
                _uiState.value = _uiState.value.copy(isLoading = false)
            }

        }
    }

    private fun calculateStats(thisWeek: List<TripItemDto>, lastWeek: List<TripItemDto>): DashboardUiState {

        //Calculating average score from trip scores
        val avgScore = thisWeek.flatMap { it.trip_scores ?: emptyList() }
            .mapNotNull { it.overallScore }.average().takeIf { !it.isNaN() }?.toInt() ?: 0

        //Calculating distance
        val thisDist = thisWeek.sumOf { it.distanceKm ?: 0.0 }
        val lastDist = lastWeek.sumOf { it.distanceKm ?: 0.0 }

        //Calculating time
        val thisTime = thisWeek.sumOf { it.durationMinutes ?: 0 }
        val lastTime = lastWeek.sumOf { it.durationMinutes ?: 0 }

        //Calculating distance
        val thisFuel = thisWeek.mapNotNull { it.fuelEstimate }.average().takeIf { !it.isNaN() } ?: 0.0
        val lastFuel = lastWeek.mapNotNull { it.fuelEstimate }.average().takeIf { !it.isNaN() } ?: 0.0

        return DashboardUiState(
            overallScore = avgScore,
            weeklyDistance = thisDist.toInt(),
            weeklyDistanceChange = calculatePercentageChange(thisDist, lastDist),
            weeklyTime = thisTime,
            weeklyTimeChange = calculatePercentageChange(thisTime.toDouble(), lastTime.toDouble()),
            weeklyFuel = thisFuel.toInt(),
            weeklyFuelChange = calculatePercentageChange(thisFuel, lastFuel),
            weeklyTrips = thisWeek.size,
            weeklyTripsChange = calculatePercentageChange(thisWeek.size.toDouble(), lastWeek.size.toDouble())
        )

    }

    private fun calculatePercentageChange(current: Double, previous: Double): Int {

        if (previous == 0.0) return if (current > 0.0) 100 else 0

        return (((current - previous) / previous) * 100).toInt()

    }

}
