package com.omnitech.drivingtracker.data.sensors

import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import dagger.hilt.android.qualifiers.ApplicationContext
import android.content.Context
import javax.inject.Singleton
import javax.inject.Inject

@Singleton
class SensorFusionManager @Inject constructor(
    @ApplicationContext private val context: Context
): SensorEventListener {

    companion object{
        private const val TAG = "SensorFusion"

        //speed gates
        //below min speed no events are triggered
        const val MINIMUM_SPEED_KMH = 15f

        //speed boundaries
        const val CITY_MAX_KMH = 80f
        const val HIGHWAY_MIN_KMH = 100f


        //Brake thresholds per zone
        //higher threshold in city cause of start-stop nature
        //lower threshold on highway - hard brake at speed is dangerous
        const val BRAKE_THRESHOLD_CITY = 8.0f
        const val BRAKE_THRESHOLD_SUBURBAN = 6.5f
        const val BRAKE_THRESHOLD_HIGHWAY = 5.0f

        //Acceleration thresholds
        const val ACCEL_THRESHOLD_CITY = 7.0f
        const val ACCEL_THRESHOLD_SUBURBAN = 6.0f
        const val ACCEL_THRESHOLD_HIGHWAY = 4.5f

        //Corner thresholds
        const val CORNER_THRESHOLD_LOW = 7.0f
        const val CORNER_THRESHOLD_MID = 6.0f
        const val CORNER_THRESHOLD_HIGH = 4.5f

    }
}