package com.omnitech.drivingtracker.ui.notification

import androidx.lifecycle.ViewModel
import com.omnitech.drivingtracker.data.local.SessionManager
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject

@HiltViewModel
class NotificationViewModel @Inject constructor(private val sessionManager: SessionManager): ViewModel(){

    fun hasRequestedBefore(): Boolean = sessionManager.hasRequestedNotification()

    fun markAsRequested() {
        sessionManager.setNotificationRequested()
    }
}