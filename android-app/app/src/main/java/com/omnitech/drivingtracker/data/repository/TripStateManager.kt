package com.omnitech.drivingtracker.data.repository

import com.omnitech.drivingtracker.data.models.MapPoiItem
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
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

    private val _baseTravelTimeSeconds = MutableStateFlow<Int?>(null);

    val baseTravelTimeSeconds = _baseTravelTimeSeconds.asStateFlow()

    private val _detourTravelTimeSeconds = MutableStateFlow<Int?>(null);

    val detourTravelTimeSeconds = _detourTravelTimeSeconds.asStateFlow()

    fun setExpectedTravelTime(seconds: Int){
        _baseTravelTimeSeconds.value = seconds
    }

    fun setDetourTime(seconds: Int){
        _detourTravelTimeSeconds.value = seconds
    }

    fun clearDetour(){ _detourTravelTimeSeconds.value = null }

    val totalExpectedTravelTime = combine(
        _baseTravelTimeSeconds,
        _detourTravelTimeSeconds
    ){ base, detour ->
        val b = base?: 0
        val d = detour?:0
        val adjustedDetour = (d * 1.5).toInt()
        b + adjustedDetour
    }.stateIn(
        scope = CoroutineScope(Dispatchers.Default + SupervisorJob()),
        started = SharingStarted.Eagerly,
        initialValue = 0
    )

    fun updateSafetyCheck(state: SafetyCheckState){
        _safetyCheck.value = state
        _baseTravelTimeSeconds.value = null
    }

    fun clearSafetyCheck(){
        _safetyCheck.value = SafetyCheckState()
    }

    fun updateNearbyPois(pois: List<MapPoiItem>) {
        _nearbyPois.value = pois
    }

    fun clearTripState() {
        _nearbyPois.value = emptyList()
        _baseTravelTimeSeconds.value = null
        _detourTravelTimeSeconds.value = null
    }
}