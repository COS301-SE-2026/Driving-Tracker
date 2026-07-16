package com.omnitech.drivingtracker.ui.achievements

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.omnitech.drivingtracker.data.api.ApiException
import com.omnitech.drivingtracker.data.models.LeaderboardData
import com.omnitech.drivingtracker.data.repository.AchievementsRepository
import com.omnitech.drivingtracker.services.NotificationHelper
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
        data class Success(
            val leaderboard: LeaderboardData,
            val categories: List<String> = emptyList(),
            val scopes: List<String> = emptyList()
        ) : UiState()
        data class Error(val code: String? = null, val message: String? = null) : UiState()
    }

    private val _uiState = MutableStateFlow<UiState>(UiState.Idle)
    val uiState: StateFlow<UiState> = _uiState

    init {
        getLeaderboard()
        getCategories()
        getScopes()
    }

    fun getLeaderboard(category: String = "OVERALL", scope: String = "WEEKLY"){

        viewModelScope.launch {

            if(_uiState.value !is UiState.Success){
                _uiState.value = UiState.Loading
            }

            repository.getLeaderboard(category, scope).fold(
                onSuccess = { data ->
                    val currentState = _uiState.value
                    if(currentState is UiState.Success) {
                        _uiState.value = currentState.copy(leaderboard = data)
                    }
                    else {
                        _uiState.value = UiState.Success(leaderboard = data)
                    }
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

    fun getCategories(){

        viewModelScope.launch {
            _uiState.value = UiState.Loading
            repository.getCategories().fold(
                onSuccess = { data ->
                    val currentState = _uiState.value

                    if(currentState is UiState.Success){
                        _uiState.value = currentState.copy(categories = data.categories)
                    }

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

    fun getScopes(){

        viewModelScope.launch {
            _uiState.value = UiState.Loading
            repository.getScopes().fold(
                onSuccess = { data ->
                    val currentState = _uiState.value

                    if(currentState is UiState.Success){
                        _uiState.value = currentState.copy(scopes = data.scopes)
                    }

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
