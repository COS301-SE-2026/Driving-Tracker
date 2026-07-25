package com.omnitech.drivingtracker.data.db.daos

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.omnitech.drivingtracker.data.db.entities.TripEventEntity
import com.omnitech.drivingtracker.data.db.entities.TripReadingEntity

@Dao
interface TripEventDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEvent(event: TripEventEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEvents(events: List<TripEventEntity>)

    @Query("SELECT * FROM trip_events WHERE trip_id = :tripId ORDER BY recorded_at ASC")
    suspend fun getTripEvents(tripId: String): List<TripEventEntity>

    @Query("SELECT * FROM trip_events WHERE trip_id = :tripId AND synced=0 ORDER BY recorded_at ASC")
    suspend fun getUnsyncedTripEvents(tripId: String): List<TripEventEntity>

    @Query("DELETE FROM trip_events WHERE trip_id = :tripId AND synced=1")
    suspend fun deleteSyncedEvents(tripId: String)

    @Query("DELETE FROM trip_events WHERE trip_id = :tripId")
    suspend fun deleteAllTripEvents(tripId: String)

    @Query("UPDATE trip_events SET synced=1 WHERE event_id IN (:eventIds)")
    suspend fun markManyAsSynced(eventIds: List<Int>)

    @Query("UPDATE trip_events SET synced=1 WHERE event_id = :eventId")
    suspend fun markAsSynced(eventId: Int)
}