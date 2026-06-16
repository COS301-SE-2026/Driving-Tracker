package com.omnitech.drivingtracker.data.db

import androidx.room.Database
import androidx.room.RoomDatabase
import com.omnitech.drivingtracker.data.db.daos.UserDao
import com.omnitech.drivingtracker.data.db.entities.UserEntity

@Database(entities = [UserEntity::class], version = 1)
abstract class AppDatabase: RoomDatabase() {
    abstract fun userDao(): UserDao
}