package com.omnitech.drivingtracker.di

import android.content.Context
import com.omnitech.drivingtracker.data.local.SessionManager
import com.omnitech.drivingtracker.data.obd.ObdManager
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    @Provides
    @Singleton
    fun provideSessionManager(@ApplicationContext context: Context): SessionManager {
        return SessionManager(context)
    }

    @Provides
    @Singleton
    fun provideObdManager(@ApplicationContext context: Context): ObdManager {
        return ObdManager(context)
    }
}