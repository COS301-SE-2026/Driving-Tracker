package com.omnitech.drivingtracker.di

import com.omnitech.drivingtracker.data.sensors.ISensorFusionManager
import com.omnitech.drivingtracker.data.sensors.SensorFusionManager
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class SensorModule {
    @Binds
    @Singleton
    abstract fun bindSensorManager(impl: SensorFusionManager): ISensorFusionManager
}