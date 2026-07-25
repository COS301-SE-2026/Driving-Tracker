package com.omnitech.drivingtracker.di

import android.content.Context
import androidx.room.Room
import com.omnitech.drivingtracker.data.db.AppDatabase
import com.omnitech.drivingtracker.data.db.daos.TripDao
import com.omnitech.drivingtracker.data.db.daos.TripEventDao
import com.omnitech.drivingtracker.data.db.daos.TripReadingDao
import com.omnitech.drivingtracker.data.db.daos.UserDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideAppDatabase(@ApplicationContext context: Context): AppDatabase{

        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "drive_local"
            ).build()
    }

    @Provides
    fun provideUserDao(db: AppDatabase): UserDao = db.userDao()

    @Provides
    fun provideTripDao(db: AppDatabase): TripDao = db.tripDao()

    @Provides
    fun provideTripReadingDao(db: AppDatabase): TripReadingDao = db.tripReadingDao()

    @Provides
    fun provideTripEventDao(db: AppDatabase): TripEventDao = db.tripEventDao()

}