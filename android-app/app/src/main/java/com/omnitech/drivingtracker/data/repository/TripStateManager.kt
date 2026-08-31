package com.omnitech.drivingtracker.data.repository

import com.omnitech.drivingtracker.data.models.MapPoiItem
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TripStateManager @Inject constructor(){

    private val _nearbyPois = MutableStateFlow<List<MapPoiItem>>(emptyList())
    val nearbyPois: StateFlow<List<MapPoiItem>> = _nearbyPois

    data class SafetyCheckState(
        val stopEventId: String? = null,
        val address: String? = null,
        val  shouldPrompt: Boolean = false
    )

    private val _safetyCheck = MutableStateFlow(SafetyCheckState())
    val safetyCheck:  StateFlow<SafetyCheckState> = _safetyCheck.asStateFlow()

    fun updateSafetyCheck(state: SafetyCheckState){
        _safetyCheck.value = state
    }

    fun clearSafetyCheck(){
        _safetyCheck.value = SafetyCheckState()
    }

    fun updateNearbyPois(pois: List<MapPoiItem>) {
        _nearbyPois.value = pois
    }

    fun clearTripState() {
        _nearbyPois.value = emptyList()
    }
}