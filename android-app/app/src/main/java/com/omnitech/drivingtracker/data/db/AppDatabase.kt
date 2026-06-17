package com.omnitech.drivingtracker.data.db

import androidx.room.Database
import androidx.room.RoomDatabase
import com.omnitech.drivingtracker.data.db.daos.TripDao
import com.omnitech.drivingtracker.data.db.daos.TripReadingDao
import com.omnitech.drivingtracker.data.db.daos.UserDao
import com.omnitech.drivingtracker.data.db.entities.TripEntity
import com.omnitech.drivingtracker.data.db.entities.TripReadingEntity
import com.omnitech.drivingtracker.data.db.entities.UserEntity

@Database(entities = [UserEntity::class, TripEntity::class, TripReadingEntity::class], version = 1)
abstract class AppDatabase: RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun tripDao(): TripDao
    abstract fun tripReadingDao(): TripReadingDao
}