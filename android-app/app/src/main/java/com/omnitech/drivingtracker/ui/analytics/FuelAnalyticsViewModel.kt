package com.omnitech.drivingtracker.ui.analytics
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.omnitech.drivingtracker.data.repository.VehicleRepository
import com.omnitech.drivingtracker.data.models.FuelHistoryPointDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.YearMonth
import javax.inject.Inject

data class FuelAnalyticsUiState(
    val isLoading: Boolean = true,
    val avgFuelEfficiency: Double? = null,
    val bestTripFuel: Double? = null,
    val worstTripFuel: Double? = null,
    val changeFromLastMonth: Double? = null, //for the change in fuel eff per month
    val history: List<FuelHistoryPointDto> = emptyList(), //to construct the graph
    val error: String? = null
)

@HiltViewModel
class FuelAnalyticsViewModel @Inject constructor(
    private val vehicleRepository: VehicleRepository
) : ViewModel(){
    private val _uiState = MutableStateFlow(FuelAnalyticsUiState())
    val uiState: StateFlow<FuelAnalyticsUiState> = _uiState.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)

            vehicleRepository.getFuelAnalytics().fold(

                onSuccess = {
                    dto ->
                    val now = YearMonth.now()
                    val thisMonth = dto.history.filter {
                        yearMonthOfOrNull(it.date) == now
                    }
                    val prevMonthPoints = dto.history.filter {
                        yearMonthOfOrNull(it.date) == now.minusMonths(1)
                    }

                    val thisAvg = thisMonth.mapNotNull {it.efficiencyLPer100Km}.averageOrNull()
                    val lastAvg = prevMonthPoints.mapNotNull {it.efficiencyLPer100Km}.averageOrNull()

                    _uiState.value = FuelAnalyticsUiState(
                        isLoading = false,
                        avgFuelEfficiency = dto.averageFuelEfficiency,
                        bestTripFuel = dto.bestFuelEfficiency,
                        worstTripFuel = dto.worstFuelEfficiency,
                        changeFromLastMonth = if (thisAvg != null && lastAvg != null) thisAvg - lastAvg else null,
                        history = dto.history
                    )
                },
                onFailure = {
                    exception -> _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = exception.message
                    )
                }
            )
        }
    }
}

private fun yearMonthOfOrNull(date: String) : YearMonth? =
    runCatching { YearMonth.from(LocalDate.parse(date)) }.getOrNull()
//returns null instead of crashing

private fun List<Double>.averageOrNull(): Double? =
    if (isEmpty()) null
    else average()