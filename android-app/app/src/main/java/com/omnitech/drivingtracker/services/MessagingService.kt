package com.omnitech.drivingtracker.services

import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MessagingService: FirebaseMessagingService() {

    @Inject lateinit var notificationHelper: NotificationHelper

    override fun onMessageReceived(message: RemoteMessage) {
        //Handle incoming messages
        val title = message.notification?.title ?: "Driving Tracker"
        val body = message.notification?.body ?: "You have a new update"
        
        notificationHelper.showGeneralNotification(title, body)
    }

    @Deprecated("Use onRegistered instead", ReplaceWith("onRegistered(token)"))
    override fun onNewToken(token: String) {
        onRegistered(token)
    }

    override fun onRegistered(installationId: String) {
        // Handle new registration/token changes
        // Send id to the backend

    }

    companion object {
        private const val TAG = "MessagingService"
    }
}
