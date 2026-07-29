package com.omnitech.drivingtracker.data.db.entities

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(tableName = "trip_events",
    foreignKeys=[ForeignKey(
        entity = TripEntity::class,
        parentColumns = ["trip_id"],
        childColumns = ["trip_id"],
        onDelete = ForeignKey.CASCADE
    )
    ],
    indices=[Index("trip_id")]
)
data class TripEventEntity(
    @ColumnInfo(name="event_id") @PrimaryKey(autoGenerate = true) val eventId: Int=0,
    @ColumnInfo(name="trip_id") val tripId: String,
    val type: String,
    val latitude: Double?,
    val longitude: Double?,
    val severity: Float?,
    @ColumnInfo(name="sensor_source") val sensorSource: String?,
    @ColumnInfo(name="recorded_at") val recordedAt: Long,
    val synced: Boolean=false
)
