package com.omnitech.drivingtracker.ui.analytics

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.omnitech.drivingtracker.data.models.FuelComparisonData
import com.omnitech.drivingtracker.data.repository.VehicleRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class FuelComparisonUiState {
    object Loading : FuelComparisonUiState()
    data class Success(
        val data: FuelComparisonData,
        val efficiencyDelta: Double,
        val isBeatingStandard: Boolean
    ) : FuelComparisonUiState()
    data class Error(val message: String) : FuelComparisonUiState()
}

@HiltViewModel
class FuelComparisonViewModel @Inject constructor(
    private val vehicleRepository: VehicleRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<FuelComparisonUiState>(FuelComparisonUiState.Loading)
    val uiState: StateFlow<FuelComparisonUiState> = _uiState.asStateFlow()

    init {
        fetchFuelComparison()
    }

    fun fetchFuelComparison() {
        viewModelScope.launch {
            _uiState.value = FuelComparisonUiState.Loading
            vehicleRepository.getFuelComparison().fold(
                onSuccess = { data ->
                    //calculationg the delta(L/100km)
                    val delta = data.userAverage - data.manufacturerStandard
                    val isBeatingStandard = delta <= 0

                    _uiState.value = FuelComparisonUiState.Success(
                        data = data,
                        efficiencyDelta = delta,
                        isBeatingStandard = isBeatingStandard
                    )
                },

                onFailure = { exception ->
                    _uiState.value = FuelComparisonUiState.Error(
                        exception.message ?: "An unexpected error occurred"
                    )
                }
            )
        }
    }

}