package com.omnitech.drivingtracker

import android.app.Application
import com.omnitech.drivingtracker.data.AppContainer

class DrivingTrackerApp : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }
}
