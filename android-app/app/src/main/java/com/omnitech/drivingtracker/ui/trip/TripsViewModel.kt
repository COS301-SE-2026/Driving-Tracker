package com.omnitech.drivingtracker.ui.trip

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.omnitech.drivingtracker.data.api.ApiException
import com.omnitech.drivingtracker.data.models.TripHistoryData
import com.omnitech.drivingtracker.data.models.TripItemDto
import com.omnitech.drivingtracker.data.repository.TripRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class TripsViewModel(private val repository: TripRepository = TripRepository()) : ViewModel() {
    sealed class UiState {
        object Idle : UiState()
        object Loading : UiState()
        data class Success(val trips: List<TripItemDto>) : UiState()
        data class Error(val code: String? = null, val message: String? = null) : UiState()
    }

    private val _uiState = MutableStateFlow<UiState>(UiState.Idle)
    val uiState: StateFlow<UiState> = _uiState

    fun loadTripsHistory(){
        viewModelScope.launch{
            _uiState.value = UiState.Loading
            repository.getTripHistory()
                .onSuccess { data ->
                    _uiState.value = UiState.Success(data.trips)
                }
                .onFailure { exception ->
                    when (exception) {
                        is ApiException -> {
                            _uiState.value = UiState.Error(
                                code = exception.errorCode,
                                message = exception.errorMessage ?: "Failed to load trips"
                            )
                        }
                        else -> {
                            _uiState.value = UiState.Error(
                                message = exception.message ?: "Unknown error"
                            )
                        }
                    }
                }
        }
    }

    init {
        loadTripsHistory()
    }
}