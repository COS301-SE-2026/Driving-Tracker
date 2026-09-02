package com.omnitech.drivingtracker.services

import java.time.Duration
import java.time.Instant
import kotlin.math.roundToLong


class TripDurationMonitor(
    private val expectedTravelTimeSeconds: Long,
    private val overPercentThreshold: Double = 0.5,
    private val minimumOverSeconds: Long = 600,
    private val stopSpeedThresholdKmh: Float = 5f,
    private val onUnusualDuration: (movingSeconds: Long, expectedSeconds: Long) -> Unit
) {

    private var accumulatedMovingSeconds: Long = 0
    private var lastUpdateAt: Instant? = null
    private var isCurrentlyStopped = false
    private var thresholdFired = false

    fun onLocationUpdate(speedKmh: Float, timestamp: Instant){
        if(thresholdFired) return

        val last = lastUpdateAt
        if(last != null && !isCurrentlyStopped){

            val deltaSeconds = Duration.between(last, timestamp).seconds
            if(deltaSeconds > 0){
                accumulatedMovingSeconds += deltaSeconds
            }
        }

        isCurrentlyStopped = speedKmh <=stopSpeedThresholdKmh
        lastUpdateAt = timestamp

        val thresholdSeconds = maxOf(
            (expectedTravelTimeSeconds * (1 + overPercentThreshold)).roundToLong(),
            expectedTravelTimeSeconds + minimumOverSeconds
            )

        if(accumulatedMovingSeconds >= thresholdSeconds){
            thresholdFired = true
            onUnusualDuration(accumulatedMovingSeconds, expectedTravelTimeSeconds)
        }
    }
}