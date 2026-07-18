package com.omnitech.drivingtracker.services

import android.Manifest
import android.app.ForegroundServiceStartNotAllowedException
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.ServiceCompat
import androidx.core.content.PermissionChecker
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class TripTrackingService: Service() {

    @Inject
    lateinit var notificationHelper: NotificationHelper

    private var currentTripId: String? = null

    companion object {
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

    }

    private fun startForeground() {

        val locationPermission = PermissionChecker.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)

        if(locationPermission != PermissionChecker.PERMISSION_GRANTED) {
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
                stopSelf()
            }
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val tripId = intent?.getStringExtra("EXTRA_TRIP_ID")

        if(tripId != null) {
            currentTripId = tripId
        }

        when (intent?.action) {

             ACTION_START_TRIP -> {
                 startForeground()
             }
             ACTION_STOP_TRIP -> {
                 stopForeground(STOP_FOREGROUND_REMOVE)
                 stopSelf()
             }
             null -> {
                 //recover using room stored tripId
             }
         }
        return START_STICKY
    }




}