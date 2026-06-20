package com.omnitech.drivingtracker.ui.achievements

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.omnitech.drivingtracker.data.api.ApiException
import com.omnitech.drivingtracker.data.models.LeaderboardData
import com.omnitech.drivingtracker.data.repository.AchievementsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AchievementsViewModel @Inject constructor(private val repository: AchievementsRepository) : ViewModel() {

    sealed class UiState {
        object Idle : UiState()
        object Loading : UiState()
        data class Success(val leaderboard: LeaderboardData) : UiState()
        data class Error(val code: String? = null, val message: String? = null) : UiState()
    }

    private val _uiState = MutableStateFlow<UiState>(UiState.Idle)
    val uiState: StateFlow<UiState> = _uiState

    init {
        getLeaderboard()
    }

    fun getLeaderboard(category: String = "OVERALL", scope: String = "WEEKLY"){

        viewModelScope.launch {
            _uiState.value = UiState.Loading
            repository.getLeaderboard(category, scope).fold(
                onSuccess = { data ->
                    _uiState.value = UiState.Success(data)
                },
                onFailure = { exception ->
                    when (exception) {
                        is ApiException -> {
                            _uiState.value = UiState.Error(
                                code = exception.errorCode,
                                message = exception.errorMessage ?: "Failed to load leaderboard"
                            )
                        }
                        else -> {
                            _uiState.value = UiState.Error(
                                message = exception.message ?: "An unknown error occurred"
                            )
                        }
                    }
                }
            )
        }
    }
}
