package com.omnitech.drivingtracker.ui.trip

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.omnitech.drivingtracker.data.api.ApiException
import com.omnitech.drivingtracker.data.models.TripSummaryDto
import com.omnitech.drivingtracker.data.repository.TripRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class TripSummaryViewModel(private val repository: TripRepository) : ViewModel() {
    sealed class UiState {
        object Idle : UiState()
        object Loading : UiState()
        data class Success(val trip: TripSummaryDto) : UiState()
        data class Error(val code: String? = null, val message: String? = null) : UiState()
    }

    private val _uiState = MutableStateFlow<UiState>(UiState.Idle)
    val uiState: StateFlow<UiState> = _uiState

    fun loadTripSummary(tripId: String){
        viewModelScope.launch{
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

    class TripSummaryViewModelFactory(private val repository: TripRepository) : ViewModelProvider.Factory {
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return TripSummaryViewModel(repository) as T
        }
    }
}