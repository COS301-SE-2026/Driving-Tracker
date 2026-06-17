package com.omnitech.drivingtracker.data.db.daos

import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import com.omnitech.drivingtracker.data.db.entities.TripEntity

interface TripDao {

    @Insert
    suspend fun insertTrip(trip: TripEntity)

    @Delete
    suspend fun deleteTrip(trip: TripEntity)

}