package com.omnitech.drivingtracker.data.db.daos

import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.omnitech.drivingtracker.data.db.entities.TripEntity

interface TripDao {

    @Insert
    suspend fun insertTrip(trip: TripEntity)

    @Update
    suspend fun updateTrip(trip : TripEntity)

    @Delete
    suspend fun deleteTrip(trip: TripEntity)

    @Query("SELECT * FROM trips WHERE trip_id = :tripId")
    suspend fun getTripById(tripId: String): TripEntity?

    @Query("SELECT * FROM trips WHERE user_id = :userId ORDER BY startTime DESC")
    suspend fun getUserTrips(userId: String): List<TripEntity>

    @Query("SELECT * FROM trips WHERE user_id = :userId AND synced = '0' ORDER BY startTime DESC")
    suspend fun getUnsyncedTrips(userId: String): List<TripEntity>

    @Query("UPDATE trips SET synced = 1 WHERE trip_id = :tripId")
    suspend fun markTripSynced(tripId: String)

}