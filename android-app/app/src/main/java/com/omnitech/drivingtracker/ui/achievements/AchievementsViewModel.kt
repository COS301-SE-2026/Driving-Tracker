package com.omnitech.drivingtracker.ui.achievements

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.omnitech.drivingtracker.R
import com.omnitech.drivingtracker.data.api.ApiException
import com.omnitech.drivingtracker.data.models.BadgeDefinition
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

data class BadgeUiModel(
    val badgeId: String,
    val name: String,
    val description: String,
    val category: String,
    val iconRes: Int,
    val isEarned: Boolean,
    val currentProgress: Int,
    val targetProgress: Int
)

data class Challenge(
    val id: String,
    val title: String,
    val description: String,
    val currentProgress: Int,
    val targetProgress: Int
)
data class AchievementsUiState(
    val leaderboard: LeaderboardData? = null,
    val categories: List<String> = emptyList(),
    val scopes: List<String> = emptyList(),
    val overallScore: Int = 0,
    val badges: List<BadgeUiModel> = emptyList(),
    val challenges: List<Challenge> = emptyList(),
    val isLoadingLeaderboard: Boolean = false,
    val isLoadingFilters: Boolean = false,
    val isLoadingBadges: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class AchievementsViewModel @Inject constructor(
    private val repository: AchievementsRepository,
    private val tripRepository: TripRepository
) : ViewModel() {

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
        getCategories(); getScopes(); getLeaderboard(); fetchOverallScore(); fetchBadges()
    }

    private fun fetchBadges() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoadingBadges = true)

            val definitionsResult = repository.getBadgeDefinitions()
            val earnedResult = repository.getBadges()

            //Fallback definitions if API fails
            val fallbackDefinitions = listOf(
                BadgeDefinition("1", "First Drive", "Complete your very first trip", "MILESTONE", "", emptyList()),
                BadgeDefinition("2", "On Board", "Connect to the OBD device for the first time", "MILESTONE", "", emptyList()),
                BadgeDefinition("3", "Safety Officer", "Go 4 days without bad driving habits", "SAFETY", "", emptyList()),
                BadgeDefinition("4", "Speed Angel", "Complete 3 trips with an average speed below 80km/h", "SAFETY", "", emptyList()),
                BadgeDefinition("5", "Throttle Goat", "Complete 5 trips without a hard acceleration event", "SAFETY", "", emptyList())
            )

            val definitions = if (definitionsResult.isSuccess) definitionsResult.getOrThrow().badges else fallbackDefinitions
            val earned = if (earnedResult.isSuccess) earnedResult.getOrThrow().earned else emptyList()


            val badges = definitions.map { def ->
                val earnedBadge = earned.find { it.badgeId == def.badgeId }
                BadgeUiModel(
                    badgeId = def.badgeId,
                    name = def.name,
                    description = def.description,
                    category = def.category,
                    iconRes = mapIconToRes(def.name),
                    isEarned = earnedBadge != null,
                    currentProgress = earnedBadge?.current ?: 0,
                    targetProgress = def.criteria.firstOrNull()?.target?.toInt() ?: 1
                )
            }

            //Active challenges are badges that aren't earned yet
            val challenges = badges.map { badge ->
                Challenge(
                    id = badge.badgeId.toString(),
                    title = badge.name,
                    description = badge.description,
                    currentProgress = badge.currentProgress,
                    targetProgress = badge.targetProgress
                )
            }

            _uiState.value = _uiState.value.copy(
                badges = badges,
                challenges = challenges,
                isLoadingBadges = false
            )

        }
    }

    private fun mapIconToRes(name: String): Int = when (name.lowercase()) {
        "on board", "on-board" -> R.drawable.badge_on_board
        "safety officer" -> R.drawable.badge_safety_officer
        "speed angel" -> R.drawable.badge_speed_angel
        "throttle goat" -> R.drawable.badge_throttle_goat
        "first drive" -> R.drawable.badge_first_drive
        else -> R.drawable.badge_first_drive
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
