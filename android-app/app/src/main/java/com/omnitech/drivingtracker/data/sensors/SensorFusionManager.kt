package com.omnitech.drivingtracker.data.sensors

import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import dagger.hilt.android.qualifiers.ApplicationContext
import android.content.Context
import android.hardware.SensorManager
import javax.inject.Singleton
import javax.inject.Inject
import android.location.Location
import com.omnitech.drivingtracker.data.models.LiveSensorMetrics
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.StateFlow
import android.util.Log
import com.omnitech.drivingtracker.data.models.SpeedZone
import java.time.format.DateTimeFormatter
import kotlin.math.sqrt
import kotlin.math.abs
import java.time.Instant

@Singleton
class SensorFusionManager @Inject constructor(
    @param:ApplicationContext private val context: Context
): ISensorFusionManager, SensorEventListener {

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

        //Acceleration thresholds (m/s^2)
        const val ACCEL_THRESHOLD_CITY = 7.0f
        const val ACCEL_THRESHOLD_SUBURBAN = 6.0f
        const val ACCEL_THRESHOLD_HIGHWAY = 4.5f

        //Corner thresholds (rad/s)
        const val CORNER_THRESHOLD_LOW = 7.0f
        const val CORNER_THRESHOLD_MID = 6.0f
        const val CORNER_THRESHOLD_HIGH = 4.5f

        //Crash thresholds (m/s^2)
        //only fires if average of recent readings exceeds this
        const val CRASH_THRESHOLD = 25.0f
        const val CRASH_BUFFER_SIZE = 5
        const val CRASH_MIN_SPEED_KMH = 4.5f

        //Debounce - same event cannot fire more than once per window
        const val DEBOUNCE_MS = 3000L

        //Reading emission
        const val READING_INTERVAL_MS = 1000L
    }

    //Sensors
    //Virtual fused sensors - uses devices hardware DSP rather than app CPU

    private val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager

    //TYPE_LINEAR_ACCELERATION - accelerometer with gravity removed
    private val linearAccelSensor = sensorManager.getDefaultSensor((Sensor.TYPE_LINEAR_ACCELERATION))

    //TYPE_ROTATION_VECTOR - accel + gyro + magnetometer
    private val rotationVectorSensor = sensorManager.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR)

    //Raw gyroscope for yaw rate
    private val gyroscopeSensor = sensorManager.getDefaultSensor(Sensor.TYPE_GYROSCOPE)

    //Current sensor state
    private var linearAccel = FloatArray(3)
    private var rotationVector = FloatArray(4)
    private var gyroscope = FloatArray(3)
    private var currentLocation: Location? = null

    //callbacks
    private var onReading: ((FusedReading) -> Unit)? = null
    private var onEvent: ((FusedEvent) -> Unit)? = null

    //stateflow for UI
    private val _liveMetrics = MutableStateFlow(LiveSensorMetrics())
    override val liveMetrics: StateFlow<LiveSensorMetrics> = _liveMetrics.asStateFlow()

    //Debounce tracking
    private var lastBrakeTime = 0L
    private var lastAccelTime = 0L
    private var lastCornerTime = 0L
    private var lastCrashTime = 0L

    //crash buffer
    private val crashBuffer = ArrayDeque<Float>()

    //reading timer
    private var lastReadingTime = 0L


    //Lifecycle
    override fun start(
        onReadingAvailable: (FusedReading) -> Unit,
        onEventDetected: (FusedEvent) -> Unit
    ){
        onReading = onReadingAvailable
        onEvent = onEventDetected

        //SENSOR_DELAY_GAME = ~20ms updates
        //Fast enough for driving detection, not as aggressive as FASTEST
        linearAccelSensor?.let{
            sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME)
            Log.d(TAG, "Linear acceleration sensor registered")
        } ?: Log.w(TAG, "TYPE_LINEAR_ACCELERATION not available")

        rotationVectorSensor?.let{
            sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME)
            Log.d(TAG, "Rotation vector sensor registered")
        } ?: Log.w(TAG, "TYPE_ROTATION_VECTOR not available")

        gyroscopeSensor?.let(){
            sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME)
            Log.d(TAG, "Gyroscope registered")
        } ?: Log.w(TAG, "TYPE_GYROSCOPE not available")

        Log.d(TAG, "Sensor fusion started")
    }

    override fun stop(){
        sensorManager.unregisterListener(this)
        onReading = null
        onEvent = null
        currentLocation = null
        crashBuffer.clear()
        _liveMetrics.value = LiveSensorMetrics()
        Log.d(TAG, "Sensor fusion stopped")
    }

    override fun updateLocation(location: Location){
        currentLocation = location
    }

    //called when there's a new sensor reading
    //Sensor Events
    override fun onSensorChanged(event: SensorEvent){
        when(event.sensor.type){
            Sensor.TYPE_LINEAR_ACCELERATION -> {
                linearAccel = event.values.clone()
                checkForLinearEvents()
            }
            Sensor.TYPE_ROTATION_VECTOR -> {
                rotationVector = event.values.clone()
                checkForCorneringEVent()
            }
            Sensor.TYPE_GYROSCOPE -> {
                gyroscope = event.values.clone()
            }
        }
        val now = System.currentTimeMillis()
        if(now - lastReadingTime >= READING_INTERVAL_MS){
            emitReading()
            lastReadingTime = now
        }
    }

    //called when sensor accuracy changes
    override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) {
        //usually left empty unless using specific calibrations
    }

    override fun triggerFakeEvent(type: String) {
        Log.d("SensorFusion", "Fake event ignored in production mode")
    }

        //Event Detection - linear (braking/acceleration/crash)
        private fun checkForLinearEvents(){
            val now = System.currentTimeMillis()
            val location = currentLocation?: return
            val speedKmh = location.speed * 3.6f

            //speed gate
            //everything below minimum speed is ignored
            if(speedKmh < MINIMUM_SPEED_KMH){
                updateSpeedZoneMetrics(speedKmh, SpeedZone.STATIONARY)
                return
            }

            val speedZone = getSpeedZone(speedKmh)
            updateSpeedZoneMetrics(speedKmh, speedZone)

            //sensor axes when phone is portrait
            // x = left/right
            // y = forward/back
            // z = up/down
            //val longitudinal = linearAccel[1]
            //total magnitude of acceleration vector
            val magnitude = sqrt(
                linearAccel[0] * linearAccel[0] +
                linearAccel[1] * linearAccel[1] +
                linearAccel[2] * linearAccel[2]
            )

            //use Y-axis as hint but total magnitude as the trigger
            val isBrakingHint = linearAccel[1]<0

            crashBuffer.addLast(magnitude)
            if(crashBuffer.size > CRASH_BUFFER_SIZE) crashBuffer.removeFirst()

            //get speed appropriate thresholds
            val brakeThreshold = getBrakeThreshold(speedKmh)
            val accelThreshold = getAccelThreshold(speedKmh)

            //Harsh braking
            //Strong negative Y = decelerating hard
            if(magnitude > brakeThreshold && isBrakingHint && now - lastBrakeTime > DEBOUNCE_MS){
                lastBrakeTime = now
                val severity = calculateSpeedScaledSeverity(
                    rawValue = abs(magnitude),
                    threshold = brakeThreshold,
                    max = 15.0f,
                    speedKmh = speedKmh
                )
                fireEvent(
                    type = "HARSH_BRAKE",
                    severity = severity,
                    speedKmh = speedKmh,
                    location = location,
                    sensorSource = "ACCELEROMETER"
                )
                Log.d(TAG, "HARSH_BRAKE: ${magnitude}m/s^2 at ${speedKmh}km/h zone=$speedZone " +
                        "threshold=$brakeThreshold severity=$severity")
            }

            //harsh acceleration
            //String positive Y = accelerating aggressively
            if(magnitude > accelThreshold && !isBrakingHint && now - lastAccelTime > DEBOUNCE_MS){
                lastAccelTime = now
                val severity = calculateSpeedScaledSeverity(
                    rawValue = magnitude,
                    threshold = accelThreshold,
                    max = 12.0f,
                    speedKmh = speedKmh
                )
                fireEvent(
                    type = "HARSH_ACCELERATION",
                    severity = severity,
                    speedKmh = speedKmh,
                    location = location,
                    sensorSource = "ACCELEROMETER"
                )
                Log.d(TAG, "HARSH_ACCELERATION: ${magnitude}m/s^2 at ${speedKmh}km/h severity=$severity")
            }

            //crash detection
            //requires sustained high total magnitude across multiple readings
            if(speedKmh >= CRASH_MIN_SPEED_KMH && crashBuffer.size >= CRASH_BUFFER_SIZE){
                val average = crashBuffer.average().toFloat()
                if(average > CRASH_THRESHOLD && now - lastCrashTime > DEBOUNCE_MS){
                    lastCrashTime = now
                    fireEvent(
                        type = "CRASH_LIKE",
                        severity = 10.0f,
                        speedKmh = speedKmh,
                        location = location,
                        sensorSource = "ACCELEROMETER"
                    )
                    Log.d(TAG, "CRASH_LIKE: avgMagnitude=${average}m/s^2 at ${speedKmh}km/h")
                }
            }
        }

        //Event detection - rotation/cornering
        private fun checkForCorneringEVent(){
            val now = System.currentTimeMillis()
            val location = currentLocation?: return
            val speedKmh = location.speed * 3.6f

            if(speedKmh < 20f ) return

            //gyroscope[2] = yaw rate = rotation around vertical axis
            //gyroscope[0] = up/down - not cornering
            //gyroscope[1] = lean side to side - not cornering
            val yawRate = abs(gyroscope[2])

            //speed aware cornering threshold
            val cornerThreshold = getCornerThreshold(speedKmh)

            if(yawRate > cornerThreshold && now - lastCornerTime > DEBOUNCE_MS){
                lastCornerTime = now
                val severity = calculateSpeedScaledSeverity(
                    rawValue = yawRate,
                    threshold = cornerThreshold,
                    max = 2.0f,
                    speedKmh = speedKmh
                )
                fireEvent(
                    type = "SHARP_CORNER",
                    severity = severity,
                    speedKmh = speedKmh,
                    location = location,
                    sensorSource = "GYROSCOPE"
                )
                Log.d(TAG, "SHARP_CORNER: yaw=${yawRate}rad/s at ${speedKmh}km/h threshold=$cornerThreshold severity=$severity")
            }
        }

    //reading emission
    private fun emitReading(){
        val location = currentLocation?: return

        val reading = FusedReading(
            timestamp = isoNow(),
            linearAccelX = linearAccel.getOrElse(0){0f},
            linearAccelY = linearAccel.getOrElse(1){0f},
            linearAccelZ = linearAccel.getOrElse(2){0f},
            gyroX = gyroscope.getOrElse(0){0f},
            gyroY = gyroscope.getOrElse(1){0f},
            gyroZ = gyroscope.getOrElse(2){0f},
            speedKmh = location.speed * 3.6f,
            latitude = location.latitude,
            longitude = location.longitude
        )
        onReading?.invoke(reading)
        //update stateflow for UI
        _liveMetrics.value = _liveMetrics.value.copy(
            speedKmh = reading.speedKmh,
            latitude = reading.latitude,
            longitude = reading.longitude,
            linearAccelY = reading.linearAccelY,
            gyroZ = reading.gyroZ
        )

        Log.d(TAG, "Reading emitted ${_liveMetrics.value.speedKmh} lat: ${_liveMetrics.value.latitude}  lng:${_liveMetrics.value.longitude}")
    }

    //speed adaptive threshold helpers
    private fun getSpeedZone(speedKmh: Float): SpeedZone = when{
        speedKmh < MINIMUM_SPEED_KMH -> SpeedZone.STATIONARY
        speedKmh < CITY_MAX_KMH -> SpeedZone.CITY
        speedKmh < HIGHWAY_MIN_KMH -> SpeedZone.SUBURBAN
        else -> SpeedZone.HIGHWAY
    }

    private fun getBrakeThreshold(speedKmh: Float): Float = when{
        speedKmh < CITY_MAX_KMH -> BRAKE_THRESHOLD_CITY
        speedKmh > HIGHWAY_MIN_KMH -> BRAKE_THRESHOLD_HIGHWAY
        else -> {
            //linear interpolation in suburban zone (80-100)
            val t = (speedKmh-CITY_MAX_KMH) / (HIGHWAY_MIN_KMH-CITY_MAX_KMH)
            BRAKE_THRESHOLD_CITY + t*(BRAKE_THRESHOLD_HIGHWAY-BRAKE_THRESHOLD_CITY)
        }
    }

    private fun getAccelThreshold(speedKmh: Float): Float = when{
        speedKmh < CITY_MAX_KMH -> ACCEL_THRESHOLD_CITY
        speedKmh > HIGHWAY_MIN_KMH -> ACCEL_THRESHOLD_HIGHWAY
        else -> {
            val t = (speedKmh-CITY_MAX_KMH) / (HIGHWAY_MIN_KMH-CITY_MAX_KMH)
            ACCEL_THRESHOLD_CITY + t*(ACCEL_THRESHOLD_HIGHWAY-ACCEL_THRESHOLD_CITY)
        }
    }

    private fun getCornerThreshold(speedKmh: Float): Float = when{
        speedKmh < 50f -> CORNER_THRESHOLD_LOW
        speedKmh < 80f -> CORNER_THRESHOLD_MID
        else -> CORNER_THRESHOLD_HIGH
    }

    //speed scaled severity calculation

    //maps raw sensor value onto 0-10 then scales by speed
    //threshold = value where event starts registering
    //max = value that maps to severity q0 at baseline speed (80km/h)
    //speed multiplier = 0.5x at 15 -> 1x at 80 -> 1.5x at 120+
    private fun calculateSpeedScaledSeverity(
        rawValue: Float,
        threshold: Float,
        max: Float,
        speedKmh: Float
    ): Float{
        val baseSeverity = ((rawValue - threshold) / (max - threshold) * 10f)
            .coerceIn(0f, 10f)
        val speedMultiplier = (speedKmh / 80f).coerceIn(0.5f, 1.5f)
        return (baseSeverity * speedMultiplier).coerceIn(0f, 10f)
    }

    //internal helpers
    private fun fireEvent(
        type: String,
        severity: Float,
        speedKmh: Float,
        location: Location,
        sensorSource: String
    ){
        val event = FusedEvent(
            type = type,
            severity = severity,
            timestamp = isoNow(),
            speedKmh = speedKmh,
            latitude = location.latitude,
            longitude = location.longitude,
            sensorSource = sensorSource
        )
        onEvent?.invoke(event)

        //update stateflow so active trip screen reflects the latest event
        _liveMetrics.value = _liveMetrics.value.copy(
            lastEventType = type,
            lastEventSeverity = severity
        )
    }

    private fun updateSpeedZoneMetrics(speedKmh: Float, zone: SpeedZone){
        if(_liveMetrics.value.currentSpeedZone != zone){
            _liveMetrics.value = _liveMetrics.value.copy(currentSpeedZone = zone)
            Log.d(TAG, "Speed zone changed to $zone at ${speedKmh}km/h")
        }
    }

    private fun isoNow(): String = DateTimeFormatter.ISO_INSTANT.format(Instant.now())
}