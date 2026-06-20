package com.omnitech.drivingtracker.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.omnitech.drivingtracker.data.models.TripItemDto
import com.omnitech.drivingtracker.data.repository.TripRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DashboardViewModel @Inject constructor(private val repository: TripRepository): ViewModel() {

    private val _recentTrip = MutableStateFlow<TripItemDto?>(null)
    val recentTrip: StateFlow<TripItemDto?> = _recentTrip

    init {
        fetchDashboardData()
    }

    private fun fetchDashboardData() {
        viewModelScope.launch {
            repository.getTripHistory().onSuccess { historyData ->
                _recentTrip.value = historyData.trips.firstOrNull()
            }
        }
    }
}
