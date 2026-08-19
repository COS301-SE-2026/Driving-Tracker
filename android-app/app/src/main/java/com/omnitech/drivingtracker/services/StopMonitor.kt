package com.omnitech.drivingtracker.services

import java.time.Duration
import java.time.Instant

class StopMonitor(
    private val onThresholdReached: (lat: Double, lng: Double, stoppedAt: Instant) -> Unit
) {
    private var stopStartedAt: Instant? = null
    private var stopLocation: Pair<Double, Double>? = null
    private var thresholdFired = false

    companion object {
        private val STOP_THRESHOLD = Duration.ofMinutes(15)
        private const val STOP_SPEED_THRESHOLD_KMH = 5f
    }

    fun onLocationUpdate(speedKmh: Float, lat: Double, lng: Double, timestamp: Instant){
        if(speedKmh <= STOP_SPEED_THRESHOLD_KMH){
            if(stopStartedAt == null){
                stopStartedAt = timestamp
                stopLocation = lat to lng
                thresholdFired = false
            } else if(!thresholdFired && Duration.between(stopStartedAt, timestamp) >= STOP_THRESHOLD){

                thresholdFired = true

                stopLocation?.let{(stopLat, stopLng) ->
                    onThresholdReached(stopLat,stopLng, stopStartedAt!!)
                }
            }
        }else{
            stopStartedAt = null
            stopLocation = null
            thresholdFired = false
        }
    }
}
