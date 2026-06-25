package com.omnitech.drivingtracker.services

import android.app.Notification
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.omnitech.drivingtracker.MainActivity
import com.omnitech.drivingtracker.R
import com.omnitech.drivingtracker.Screen
import com.omnitech.drivingtracker.data.local.NotificationChannels
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotificationHelper @Inject constructor(@param:ApplicationContext private val context: Context){

    private val notificationManager = NotificationManagerCompat.from(context)

    //Set where notification navigates to on press
    private fun buildMainActivityIntent(destination: String? = null): PendingIntent{
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
            destination?.let { putExtra("navigate_to", it) }
        }

        return PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
    }

    //trip alerts like speeding, harsh braking etc
    fun showTripAlert(title: String, message: String, tripId: String){

        val notification = NotificationCompat.Builder(context, NotificationChannels.TRIP_ALERTS)
            .setContentTitle(title)
            .setContentText(message)
            .setSmallIcon(R.drawable.ic_nav_bell) //To be changed
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(buildMainActivityIntent(Screen.LiveTrip.createRoute(tripId)))
            .setAutoCancel(true)

        try {
            notificationManager.notify(System.currentTimeMillis().toInt(), notification.build())
        } catch (e: SecurityException){
            //permission not granted by user
        }
    }

    //badge unlocks, score updates etc
    fun showGamificationNotification(title: String, message: String){

        val notification = NotificationCompat.Builder(context, NotificationChannels.GAMIFICATION)
            .setContentTitle(title)
            .setContentText(message)
            .setSmallIcon(R.drawable.ic_nav_bell) //To be changed
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(buildMainActivityIntent("achievements"))
            .setAutoCancel(true)

        try {
            notificationManager.notify(System.currentTimeMillis().toInt(), notification.build())
        } catch (e: SecurityException){
            //permission not granted by user
        }
    }

    //for active trip persistent notification (foreground)
    fun buildTripServiceNotification(tripId: String): Notification {

        val pendingIntent = buildMainActivityIntent(Screen.LiveTrip.createRoute(tripId))

        return NotificationCompat.Builder(context, NotificationChannels.TRIP_SERVICE)
            .setContentTitle("Trip in progress")
            .setContentText("Tap to return to your active trip")
            .setSmallIcon(R.drawable.stats_trips) //To be changed
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setContentIntent(pendingIntent)
            .setOngoing(true) //user cannot dismiss
            .build()
    }

    //when trip is shared to user
    fun showContactAlert(title: String, message: String){

        val notification = NotificationCompat.Builder(context, NotificationChannels.CONTACT_ALERTS)
            .setContentTitle(title)
            .setContentText(message)
            .setSmallIcon(R.drawable.ic_nav_contacts) //To be changed
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(buildMainActivityIntent("")) //To be changed
            .setAutoCancel(true)

        try {
            notificationManager.notify(System.currentTimeMillis().toInt(), notification.build())
        } catch (e: SecurityException){
            //permission not granted by user
        }
    }

}