package com.omnitech.drivingtracker.services

import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.omnitech.drivingtracker.data.local.SessionManager
import com.omnitech.drivingtracker.data.models.RegisterFcmRequest
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class MessagingService: FirebaseMessagingService() {

    @Inject lateinit var notificationHelper: NotificationHelper
    @Inject lateinit var sessionManager: SessionManager

    @Inject lateinit var api: ApiService

    private val serviceScope = CoroutineScope(SupervisorJob()+Dispatchers.IO)

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
    }

    override fun onMessageReceived(message: RemoteMessage) {
        //Handle incoming messages

        if(message.data.isNotEmpty()){
            val type = message.data["type"]

            when(type){
                "TRUSTED_CONTACT_REQUEST" -> {

                    notificationHelper.showGeneralNotification(
                        message.notification?.title ?: "Trusted Contact Request",
                        message.notification?.body ?: "You have been requested to be a trusted contact")
                }
                "SHARED_TRIP" -> {
                    val sharedBy = message.data["shared_by"]

                    notificationHelper.showContactAlert(
                        message.notification?.title ?: "Trip Shared With You",
                        message.notification?.body ?: "$sharedBy is sharing their live trip with you")
                }
                "TRIP_ALERT" -> {
                    val tripId = message.data["trip_id"]
                    notificationHelper.showTripAlert(
                        message.notification?.title ?: "Trip Alert",
                        message.notification?.body ?: "Check your driving status",
                        tripId ?: ""
                    )
                }
                else -> {
                    val title = message.notification?.title ?: "Driving Tracker"
                    val body = message.notification?.body ?: "You have a new update"
                    notificationHelper.showContactAlert(title, body)
                }
            }
        }else {
            val title = message.notification?.title ?: "Driving Tracker"
            val body = message.notification?.body ?: "You have a new update"
            notificationHelper.showGeneralNotification(title, body)
        }

    }

    @Deprecated("Use onRegistered instead", ReplaceWith("onRegistered(token)"))
    override fun onNewToken(token: String) {
        onRegistered(token)
    }

    override fun onRegistered(installationId: String) {
        // Handle new registration/token changes
        // Send id to the backend
        sessionManager.saveFcmToken(installationId)

        sessionManager.getFcmToken()?.let{
            Log.d("FCM_SAVED", it)
        }

        sessionManager.getRefreshToken()?.let {
            serviceScope.launch{
                try{
                    api.registerFcmToken(RegisterFcmRequest(installationId))
                } catch (e: Exception) {
                    Log.e("MessagingService", "Failed to register FCM token with backend", e)
                }
            }
        }
    }

}
