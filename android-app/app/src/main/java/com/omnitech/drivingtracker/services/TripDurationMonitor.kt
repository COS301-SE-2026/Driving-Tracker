package com.omnitech.drivingtracker.services

import android.util.Log
import java.time.Duration
import java.time.Instant
import kotlin.math.roundToInt
import kotlin.math.roundToLong


class TripDurationMonitor(
    val expectedTravelTimeSeconds: Int,
    private val overPercentThreshold: Double = 0.5,
    private val minimumOverSeconds: Int = 600,
    private val stopSpeedThresholdKmh: Float = 5f,
    private val onUnusualDuration: (movingSeconds: Int, expectedSeconds: Int) -> Unit
) {

    var accumulatedMovingMillis: Long = 0
    private var lastUpdateAt: Instant? = null
    private var isCurrentlyStopped = false
    private var thresholdFired = false

    fun onLocationUpdate(speedKmh: Float, timestamp: Instant){

        if(thresholdFired) return

        val last = lastUpdateAt
        if(last != null && !isCurrentlyStopped){

            val deltaMillis = Duration.between(last, timestamp).toMillis()
            if(deltaMillis > 0){
                accumulatedMovingMillis += deltaMillis
            }
        }

        isCurrentlyStopped = speedKmh <= stopSpeedThresholdKmh
        lastUpdateAt = timestamp

        val movingSeconds = (accumulatedMovingMillis / 1000).toInt()

        val thresholdSeconds = maxOf(
            (expectedTravelTimeSeconds * (1 + overPercentThreshold)).roundToInt(),
            expectedTravelTimeSeconds + minimumOverSeconds
            )

        if(movingSeconds >= thresholdSeconds){
            thresholdFired = true
            onUnusualDuration(movingSeconds, expectedTravelTimeSeconds)
        }
    }
}