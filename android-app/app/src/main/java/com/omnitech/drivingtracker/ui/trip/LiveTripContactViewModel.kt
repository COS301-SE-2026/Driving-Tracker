package com.omnitech.drivingtracker.ui.trip

import androidx.lifecycle.ViewModel
import com.omnitech.drivingtracker.data.models.LatestLocationData
import com.omnitech.drivingtracker.ui.trip.TripSummaryViewModel.UiState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import javax.inject.Inject
import androidx.lifecycle.viewModelScope
import com.omnitech.drivingtracker.services.ApiService
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

@HiltViewModel
class LiveTripContactViewModel @Inject constructor(private val api: ApiService) : ViewModel() {

    private val _location = MutableStateFlow<LatestLocationData?>(null)
    val location: StateFlow<LatestLocationData?> = _location

    fun startPolling(){
        viewModelScope.launch {
            while(isActive){
                try{
                    val result = api.getLatestLocation()

                } catch(e: Exception){

                }
                delay(5_000)
            }
        }
    }

}