package com.omnitech.drivingtracker

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import coil.ImageLoader
import coil.ImageLoaderFactory
import com.omnitech.drivingtracker.data.local.NotificationChannels
import dagger.hilt.EntryPoint
import dagger.hilt.InstallIn
import dagger.hilt.android.EntryPointAccessors
import dagger.hilt.android.HiltAndroidApp
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient

@EntryPoint
@InstallIn(SingletonComponent::class)
fun interface ImageLoaderEntryPoint{
    fun okHttpClient(): OkHttpClient
}

@HiltAndroidApp
class DrivingTrackerApp : Application(), ImageLoaderFactory {

    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
    }

    override fun newImageLoader(): ImageLoader{
        val entryPoint = EntryPointAccessors.fromApplication(this, ImageLoaderEntryPoint::class.java)
        return ImageLoader.Builder(this).okHttpClient(entryPoint.okHttpClient()).build()
    }

    private fun createNotificationChannels(){

        if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.O){

            val manager = getSystemService(NotificationManager::class.java)

            manager.createNotificationChannel(
                NotificationChannel(
                    NotificationChannels.TRIP_ALERTS,
                    "Trip Alerts",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Real-time alerts during a trip"
                }
            )

            manager.createNotificationChannel(
                NotificationChannel(
                    NotificationChannels.REST_ALERTS,
                    "Rest & Fatigue Alerts",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Rest and fatigue alerts during a trip"
                }
            )

            manager.createNotificationChannel(
                NotificationChannel(
                    NotificationChannels.GAMIFICATION,
                    "Achievements and Rewards",
                    NotificationManager.IMPORTANCE_DEFAULT
                ).apply {
                    description = "Badge unlocks, score changes and leaderboard updates"
                }
            )

            manager.createNotificationChannel(
                NotificationChannel(
                    NotificationChannels.CONTACT_ALERTS,
                    "Contact Alerts",
                    NotificationManager.IMPORTANCE_DEFAULT
                ).apply {
                    description = "Alerts from trips shared with you"
                }
            )

            manager.createNotificationChannel(
                NotificationChannel(
                    NotificationChannels.TRIP_SERVICE,
                    "Trip Tracking",
                    NotificationManager.IMPORTANCE_LOW
                ).apply {
                    description = "Shown while a trip is active and being recorded"
                }
            )

            manager.createNotificationChannel(
                NotificationChannel(
                    NotificationChannels.FCM_DEFAULT,
                    "General Notifications",
                    NotificationManager.IMPORTANCE_DEFAULT
                ).apply {
                    description = "General notifications from Driving Tracker"
                }
            )

            manager.createNotificationChannel(
                NotificationChannel(
                    NotificationChannels.CONTACT_ALERTS_HIGH,
                    "High-priority Contact Alerts",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "High priority alerts from trips shared with you"
                }
            )
        }
    }


}
