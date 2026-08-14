package com.omnitech.drivingtracker.data.repository

import com.omnitech.drivingtracker.data.models.MapPoiItem
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TripStateManager @Inject constructor(){

    private val _nearbyPois = MutableStateFlow<List<MapPoiItem>>(emptyList())
    val nearbyPois: StateFlow<List<MapPoiItem>> = _nearbyPois

    fun updateNearbyPois(pois: List<MapPoiItem>) {
        _nearbyPois.value = pois
    }
}