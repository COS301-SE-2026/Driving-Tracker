package com.omnitech.drivingtracker.services

import android.util.Log
import com.omnitech.drivingtracker.data.models.FatigueConfig
import kotlin.math.min

class FatigueMonitor(
    private val config: FatigueConfig,
    private val onAlert:  (FatigueAlertLevel) ->  Unit
) {

    enum class FatigueAlertLevel{ STANDARD, URGENT, RE_ALERT }

    private enum class DrivingState{ IDLE, DRIVING, POSSIBLE_STOP, STOPPED }

    private var state = DrivingState.IDLE

    private var lastTimestampMillis: Long? = null

    private var continuousDrivingSeconds: Double = 0.0

    private var possibleStopElapsedSeconds: Double = 0.0

    private var movingReadingStreak: Int = 0

    private var standardAlertFired = false
    private var urgentAlertFired = false
    private var secondsSinceLastReAlert: Double = 0.0

    //Feeding reading on GPS updates
    fun onLocationUpdate(speedKmh: Float, timestampMillis: Long){

        val elapsedSeconds = calculateElapsedSeconds(timestampMillis)

        lastTimestampMillis = timestampMillis

        //Guard against large gaps from service killed or phone being asleep
        val cappedElapsed = min(elapsedSeconds, config.maxElapsedSecondsPerTick)

        val isMoving = speedKmh >=config.stoppedSpeedThresholdKmh

        Log.d("Fatigue", continuousDrivingSeconds.toString())

        when(state){
            DrivingState.IDLE -> handleStationaryState(isMoving)
            DrivingState.DRIVING -> handleDrivingState(isMoving, cappedElapsed)
            DrivingState.POSSIBLE_STOP -> handlePossibleStopState(isMoving, cappedElapsed)
            DrivingState.STOPPED -> handleStationaryState(isMoving)
        }
    }

    private fun calculateElapsedSeconds(timestampMillis: Long): Double {
        val prevTimestamp = lastTimestampMillis?: return 0.0
        return ((timestampMillis - prevTimestamp) / 1000.0).coerceAtLeast(0.0)
    }

    private fun handlePossibleStopState(isMoving: Boolean, elapsed: Double){
        if(isMoving){
            state = DrivingState.DRIVING
            possibleStopElapsedSeconds = 0.0
            continuousDrivingSeconds += elapsed
            evaluateAlerts(elapsed)
        } else {
            possibleStopElapsedSeconds += elapsed
            if(possibleStopElapsedSeconds >= config.possibleStopDebounceSeconds) {
                onRealStopConfirmed()
            }
        }
    }

    private fun handleStationaryState(isMoving: Boolean){
        if(isMoving){
            movingReadingStreak++
            if(movingReadingStreak >= config.movingDebounceReadings){
                state = DrivingState.DRIVING
                movingReadingStreak = 0
            }
        } else {
            movingReadingStreak = 0
        }
    }

    private fun handleDrivingState(isMoving: Boolean, elapsed: Double){
        if(isMoving){
            continuousDrivingSeconds += elapsed
            evaluateAlerts(elapsed)
        } else {
            state = DrivingState.POSSIBLE_STOP
            possibleStopElapsedSeconds = elapsed
        }
    }

    //Evaluate which alerts need to fired
    private fun evaluateAlerts(elapsedSeconds: Double){
        val hoursDriving = continuousDrivingSeconds / 3600.0

        when {
            hoursDriving >= config.urgentAlertThresholdHours && !urgentAlertFired ->{
                urgentAlertFired = true
                secondsSinceLastReAlert = 0.0
                onAlert(FatigueAlertLevel.URGENT)
            }

            hoursDriving >= config.standardAlertThresholdHours && !standardAlertFired ->{
                standardAlertFired = true
                secondsSinceLastReAlert = 0.0
                onAlert(FatigueAlertLevel.STANDARD)
            }

            standardAlertFired ->{
                //Re-send periodically once first alert has fired but user hasn't stopped
                secondsSinceLastReAlert += elapsedSeconds
                if(secondsSinceLastReAlert >= config.reAlertIntervalMinutes * 60.0){
                    secondsSinceLastReAlert = 0.0
                    onAlert(FatigueAlertLevel.RE_ALERT)
                }
            }
        }
    }

    //Reset trackers on a real stop
    private fun onRealStopConfirmed(){
        state = DrivingState.STOPPED
        continuousDrivingSeconds = 0.0
        possibleStopElapsedSeconds = 0.0
        standardAlertFired = false
        urgentAlertFired = false
        secondsSinceLastReAlert = 0.0
    }

    fun currentDrivingSeconds(): Double = continuousDrivingSeconds

}