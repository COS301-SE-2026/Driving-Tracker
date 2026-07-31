package com.omnitech.drivingtracker

import android.location.Location
import com.omnitech.drivingtracker.data.models.LiveSensorMetrics
import com.omnitech.drivingtracker.data.sensors.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FakeSensorFusionManager @Inject constructor(): ISensorFusionManager{
    private val _liveMetrics = MutableStateFlow(LiveSensorMetrics())
    override val liveMetrics = _liveMetrics.asStateFlow()

    private var onEvent: ((FusedEvent) -> Unit)? = null

    override fun start(onReadingAvailable: (FusedReading) -> Unit, onEventDetected: (FusedEvent) -> Unit){
        this.onEvent = onEventDetected
    }

    override fun stop(){
        onEvent = null
    }

    override fun updateLocation(location: Location){}

    override fun triggerFakeEvent(type: String){
        onEvent?.invoke(FusedEvent(
            type = type,
            severity = 9.0f,
            timestamp = java.time.Instant.now().toString(),
            latitude = 36.778259,
            longitude =  -119.417931,
            speedKmh = 60f,
            sensorSource = "MOCK"
        ))
    }
}