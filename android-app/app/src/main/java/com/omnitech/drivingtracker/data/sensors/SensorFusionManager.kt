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

@Singleton
class SensorFusionManager @Inject constructor(
    @ApplicationContext private val context: Context
): SensorEventListener {

    //called when there's a new sensor reading
    override fun onSensorChanged(event: SensorEvent){
        when(event.sensor.type){
            Sensor.TYPE_LINEAR_ACCELERATION ->{
                //handle accel events
            }
            Sensor.TYPE_GYROSCOPE -> {
                //handle rotation events
            }
        }
    }

    //called when sensor accuracy changes
    override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) {

    }

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
    val liveMetrics: StateFlow<LiveSensorMetrics> = _liveMetrics.asStateFlow()

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

    fun start(
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

    fun stop(){
        sensorManager.unregisterListener(this)
        onReading = null
        onEvent = null
        currentLocation = null
        crashBuffer.clear()
        _liveMetrics.value = LiveSensorMetrics()
        Log.d(TAG, "Sensor fusion stopped")
    }

    fun updateLocation(location: Location){
        currentLocation = location
    }
}