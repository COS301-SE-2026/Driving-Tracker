package com.omnitech.drivingtracker.ui.achievements

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.omnitech.drivingtracker.data.api.ApiException
import com.omnitech.drivingtracker.data.models.LeaderboardData
import com.omnitech.drivingtracker.data.repository.AchievementsRepository
import com.omnitech.drivingtracker.data.repository.TripRepository
import com.omnitech.drivingtracker.services.NotificationHelper
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject
import java.time.Instant
import java.time.temporal.ChronoUnit

data class AchievementsUiState(
    val leaderboard: LeaderboardData? = null,
    val categories: List<String> = emptyList(),
    val scopes: List<String> = emptyList(),
    val overallScore: Int = 0,
    val isLoadingLeaderboard: Boolean = false,
    val isLoadingFilters: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class AchievementsViewModel @Inject constructor(private val repository: AchievementsRepository, private val tripRepository: TripRepository) : ViewModel() {

    val leaderboardFail = "Failed to load leaderboard"
    val unknownErrorOccurred = "An unknown error occurred"
//    sealed class UiState {
//        object Idle : UiState()
//        object Loading : UiState()
//        data class Success(
//            val leaderboard: LeaderboardData,
//            val categories: List<String> = emptyList(),
//            val scopes: List<String> = emptyList()
//        ) : UiState()
//        data class Error(val code: String? = null, val message: String? = null) : UiState()
//    }

    private val _uiState = MutableStateFlow(AchievementsUiState())
    val uiState: StateFlow<AchievementsUiState> = _uiState.asStateFlow()

    init{
        loadInitialData()
    }

    private fun loadInitialData() {
        getCategories()
        getScopes()
        getLeaderboard()
        fetchOverallScore()
    }

    private fun fetchOverallScore(){
        viewModelScope.launch {
            try{
                val now = Instant.now()
                val weekAgo = now.minus(7, ChronoUnit.DAYS).toString()

                tripRepository.getTripHistory(startDate = weekAgo).onSuccess { historyData ->
                    val avgScore = historyData.trips
                        .flatMap { it.trip_scores?: emptyList() }
                        .mapNotNull { it.overallScore }
                        .average()
                        .takeIf { !it.isNaN() }?.toInt() ?: 0

                    _uiState.value = _uiState.value.copy(overallScore = avgScore)
                }
            }catch(e: Exception){

            }

        }
    }

    fun getLeaderboard(category: String = "OVERALL", scope: String = "WEEKLY"){

        viewModelScope.launch {

            _uiState.value = _uiState.value.copy(isLoadingLeaderboard = true, error = null)

            repository.getLeaderboard(category, scope).fold(
                onSuccess = { data ->
                    _uiState.value =
                        _uiState.value.copy(leaderboard = data, isLoadingLeaderboard = false)
                },
                onFailure = { exception ->
                    _uiState.value = _uiState.value.copy(
                    isLoadingLeaderboard = false,
                    error = exception.message ?: "Failed to load leaderboard")
                }
            )
        }
    }

    private fun getCategories() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoadingFilters = true)
            repository.getCategories().fold(
                onSuccess = { data ->
                    _uiState.value = _uiState.value.copy(
                        categories = data.categories,
                        isLoadingFilters = false
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(isLoadingFilters = false)
                }
            )
        }
    }

    private fun getScopes() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoadingFilters = true)
            repository.getScopes().fold(
                onSuccess = { data ->
                    _uiState.value = _uiState.value.copy(
                        scopes = data.scopes,
                        isLoadingFilters = false
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(isLoadingFilters = false)
                }
            )
        }
    }
}
