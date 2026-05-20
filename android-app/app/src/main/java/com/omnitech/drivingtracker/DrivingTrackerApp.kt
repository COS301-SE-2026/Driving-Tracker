package com.omnitech.drivingtracker

import android.app.Application
import com.omnitech.drivingtracker.data.local.SessionManager

class DrivingTrackerApp : Application() {
    lateinit var sessionManager: SessionManager
        private set

    override fun onCreate() {
        super.onCreate()
        sessionManager = SessionManager(this)
    }
}
