package com.omnitech.drivingtracker.services

import android.Manifest
import android.annotation.SuppressLint
import android.app.ForegroundServiceStartNotAllowedException
import android.app.Service
import android.content.Context
import android.content.Intent
import android.hardware.Sensor
import android.location.Location
import android.os.Build
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.core.app.ServiceCompat
import androidx.core.content.PermissionChecker
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.omnitech.drivingtracker.data.db.entities.TripEventEntity
import com.omnitech.drivingtracker.data.db.entities.TripReadingEntity
import com.omnitech.drivingtracker.data.models.BatchReadingRequest
import com.omnitech.drivingtracker.data.models.DataSource
import com.omnitech.drivingtracker.data.models.LogEventRequest
import com.omnitech.drivingtracker.data.models.RecordReadingRequest
import com.omnitech.drivingtracker.data.sensors.FusedReading
import com.omnitech.drivingtracker.data.sensors.SensorFusionManager
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import javax.inject.Inject
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import com.omnitech.drivingtracker.data.sensors.FusedEvent
import com.omnitech.drivingtracker.data.models.LocationDto
import com.omnitech.drivingtracker.data.obd.ObdManager
import com.omnitech.drivingtracker.data.repository.TripRepository
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import java.time.Instant
import kotlin.String

@AndroidEntryPoint
class TripTrackingService: Service() {

    @Inject
    lateinit var notificationHelper: NotificationHelper
    @Inject
    lateinit var sensorFusion: SensorFusionManager
    @Inject
    lateinit var apiService: ApiService

    @Inject
    lateinit var obdManager: ObdManager

    @Inject
    lateinit var tripRepository: TripRepository

    private var currentTripId: String? = null

    private var lastKnownSpeed: Float = 0f

    private var cachedActiveShareCount: Int = 0

    private var isTrackingStarted = false
    private var lastSavedLat: Double? = null
    private var lastSavedLng: Double? = null
    private val MIN_DISTANCE_METERS = 10f

    //supervisor job - a failed reading post does not cancel event posting
    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    private lateinit var fusedLocationClient : FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback

    companion object {
        private const val TAG = "TripTrackingService"
        const val TRIP_SERVICE_ID = 1001
        const val ACTION_START_TRIP = "ACTION_START_TRIP"
        const val ACTION_STOP_TRIP = "ACTION_STOP_TRIP"

        fun startTrip(context: Context, tripId: String) {
            val intent = Intent(context, TripTrackingService::class.java).apply {
                action = ACTION_START_TRIP
                putExtra("EXTRA_TRIP_ID", tripId)
            }
            context.startForegroundService(intent)
        }

        fun stopTrip(context: Context) {
            val intent = Intent(context, TripTrackingService::class.java).apply {
                action = ACTION_STOP_TRIP
            }
            context.startService(intent)
        }
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onCreate() {
        super.onCreate()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        setupLocationCallBack()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int{
        val tripId = intent?.getStringExtra("EXTRA_TRIP_ID")
        if(tripId != null) currentTripId = tripId

        when(intent?.action){
            ACTION_START_TRIP -> {
                if(!isTrackingStarted){
                    startForegroundWithPermissionCheck()
                    startLocationUpdates()
                    startSensorFusion()
                    startSyncLoop()
                } else {
                    Log.d("Tracking", "Service already tracking")
                }

            }
            ACTION_STOP_TRIP -> {
                stopEverything()
            }
            null -> {
                //TODO: restore currentTripId from Room
                Log.w(TAG, "Restarted by OS - restore tripId from Room")
            }
        }
        return START_STICKY
    }

    override fun onDestroy() {
        stopEverything()
        serviceScope.cancel()
        super.onDestroy()
    }

    private fun startForegroundWithPermissionCheck() {

        val granted = PermissionChecker.checkSelfPermission(
            this, Manifest.permission.ACCESS_FINE_LOCATION
        ) == PermissionChecker.PERMISSION_GRANTED

        if(!granted){
            Log.e(TAG, "Location permission missing - stopping")
            stopSelf()
            return
        }

        try {
            startForeground(
                TRIP_SERVICE_ID,
                notificationHelper.buildTripServiceNotification(currentTripId?: "")
            )

        } catch( e: Exception) {
            if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
                && e is ForegroundServiceStartNotAllowedException) {
                Log.e(TAG, "Cannot start foreground from background")
                stopSelf()
            }
        }
    }

    private fun setupLocationCallBack(){
        locationCallback = object: LocationCallback(){
            override fun onLocationResult(result: LocationResult) {
                result.lastLocation?.let{location ->
                    sensorFusion.updateLocation(location)
                }
            }
        }
    }

    @SuppressLint("MissingPermission")
    private fun startLocationUpdates(){
        val request = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY,
            1000L
        ).build()

        fusedLocationClient.requestLocationUpdates(
            request,
            locationCallback,
            Looper.getMainLooper()
        )
        Log.d(TAG, "GPS updates started")
    }

    private fun stopLocationUpdates(){
        fusedLocationClient.removeLocationUpdates(locationCallback)
            .addOnCompleteListener { Log.d(TAG, "Location updates successfully removed from GPS") }
    }

    private fun startSensorFusion(){
        sensorFusion.start(
            onReadingAvailable = {reading -> postReading(reading) },
            onEventDetected = {event -> postEvent(event)}
        )
    }

    private fun isObdConnected(): Boolean = obdManager.connectionState.value == ObdManager.ConnectionState.CONNECTED

    //Adding readings to Room
    private fun postReading(reading: FusedReading){
        val tripId = currentTripId?: return

        //distance filter for live trip page
        val lastLat = lastSavedLat
        val lastLng = lastSavedLng

        if(lastLat != null && lastLng != null){
            val results = FloatArray(1)
            android.location.Location.distanceBetween(lastLat, lastLng, reading.latitude, reading.longitude, results)
            if (results[0] < MIN_DISTANCE_METERS) {
                return // Skip database recording if moved less than 10m
            }
        }
        lastSavedLat = reading.latitude
        lastSavedLng = reading.longitude

        val obdConnected = isObdConnected()



        lastKnownSpeed = if(obdConnected){
            obdManager.metrics.value.speed.toFloat()
        } else {
            reading.speedKmh
        }

        serviceScope.launch {

            val recordedAt = runCatching {
                Instant.parse(reading.timestamp).toEpochMilli()
            }.getOrDefault(System.currentTimeMillis())

            var rpm: Int? = null
            var speed: Float? = reading.speedKmh
            var coolantTemp: Int? = null
            var fuelTrim: Double? = null
            var dataSource: DataSource = DataSource.PHONE


            if(obdConnected){
                rpm = obdManager.metrics.value.rpm
                speed = obdManager.metrics.value.speed.toFloat()
                coolantTemp = obdManager.metrics.value.coolantTemp
                fuelTrim = obdManager.metrics.value.fuelTrim
                dataSource = DataSource.OBD
            }


            val readingEntity = TripReadingEntity(
                tripId = tripId,
                recordedAt = recordedAt,
                dataSource = dataSource.toString(),
                latitude = reading.latitude,
                longitude = reading.longitude,
                speedKmh = speed,
                accelerometer = reading.linearAccelY,
                gyroscopeX = reading.gyroX,
                gyroscopeY = reading.gyroY,
                gyroscopeZ = reading.gyroZ,
                rpm = rpm,
                coolantTemp = coolantTemp?.toFloat(),
                fuelTrimPercent = fuelTrim?.toFloat(),
                throttlePosition = null,
                dtcCodes = emptyList()
            )

            tripRepository.saveReadingLocally(readingEntity)
            Log.d(TAG, "Saved reading: ${readingEntity}")

        }
    }

    private fun computeSyncDelay(): Long {
        val hasActiveViewers = tripHasActiveShares()
        return when {
            hasActiveViewers  && lastKnownSpeed > 10f -> 8_000L
            hasActiveViewers -> 20_000L
            lastKnownSpeed > 10f -> 15_000L
            else -> 60_000L
        }
    }

    private fun startSyncLoop() {
        serviceScope.launch {
            while(isActive) {
                try{
                    syncPendingReadings()
                } catch(e: Exception){
                    Log.w("SyncReadings", "Sync failed, retry later")
                }

                delay(computeSyncDelay())
            }
        }
    }

    //Syncs readings from room to backend
    private suspend fun syncPendingReadings() {
        val tripId = currentTripId?: return

        val response = tripRepository.syncPendingReadings(tripId)

        response.fold(
            onSuccess = { response ->
                cachedActiveShareCount = response?.data?.activeShareCount?:0
            },
            onFailure = { exception ->
                Log.d("SyncReadings", exception.message?: "Sync failed")
                }
            )
    }

    private fun tripHasActiveShares(): Boolean = cachedActiveShareCount > 0

    private fun postEvent(event: FusedEvent){
        val tripId = currentTripId?: return

        serviceScope.launch {

            val recordedAt = runCatching {
                Instant.parse(event.timestamp).toEpochMilli()
            }.getOrDefault(System.currentTimeMillis())

            //Save event to Room db
            val entity = TripEventEntity(
                tripId = tripId,
                type = event.type,
                severity = event.severity,
                recordedAt = recordedAt,
                latitude = event.latitude,
                longitude = event.longitude,
                sensorSource = event.sensorSource,
                synced = false
            )

            tripRepository.saveEventLocally(entity)

            val alertTitle = event.type.replace("_", " ").lowercase().replaceFirstChar{ it.uppercase() }
            notificationHelper.showTripAlert(
                title = "$alertTitle Detected!",
                message = "Take care: a driving safety event was just registered.",
                tripId = tripId
            )

                try {
                    val response = apiService.logEvent(
                        tripId = tripId,
                        body = LogEventRequest(
                            event_type = event.type,
                            location = LocationDto(
                                lat = event.latitude,
                                lng = event.longitude
                            ),
                            severity = event.severity,
                            sensor_source = event.sensorSource,
                            timestamp = event.timestamp
                        )
                    )
                    tripRepository.markEventAsSynced(entity.eventId)
                    Log.d(
                        TAG,
                        "Event posted: ${event.type} id=${response.data.event_id} speed=${event.speedKmh} severity=${event.severity}"
                    )
                } catch (e: Exception) {
                    Log.w(TAG, "Failed to post event ${e.message}, remains in Room for retry")
                }
        }
    }

    private fun stopEverything(){
        Log.d(TAG, "Stopping all tracking tasks")
        stopLocationUpdates()
        sensorFusion.stop()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
        isTrackingStarted = false
        Log.d(TAG, "Trip tracking stopped")
    }
}