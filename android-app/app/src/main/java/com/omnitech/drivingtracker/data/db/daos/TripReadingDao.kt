package com.omnitech.drivingtracker.data.db.daos

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.omnitech.drivingtracker.data.db.entities.TripReadingEntity

@Dao
interface TripReadingDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertReading(reading: TripReadingEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertReadings(readings: List<TripReadingEntity>)

    @Query("SELECT * FROM trip_readings WHERE trip_id = :tripId ORDER BY recorded_at ASC")
    suspend fun getTripReadings(tripId: String): List<TripReadingEntity>

    @Query("SELECT * FROM trip_readings WHERE trip_id = :tripId AND synced=0 ORDER BY recorded_at ASC")
    suspend fun getUnsyncedTripReadings(tripId: String): List<TripReadingEntity>

    @Query("UPDATE trip_readings SET synced=1 WHERE reading_id IN (:readingIds)")
    suspend fun markAsSynced(readingIds: List<Int>)

    @Query("DELETE FROM trip_readings WHERE trip_id = :tripId AND synced=1")
    suspend fun deleteSyncedReadings(tripId: String)

    @Query("DELETE FROM trip_readings WHERE trip_id = :tripId")
    suspend fun deleteAllTripReadings(tripId: String)


}