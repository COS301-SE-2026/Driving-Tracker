package com.omnitech.drivingtracker.data.db.entities

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(tableName = "trip_readings",
    foreignKeys=[ForeignKey(
        entity = TripEntity::class,
        parentColumns = ["trip_id"],
        childColumns = ["trip_id"],
        onDelete = ForeignKey.CASCADE
    )
    ],
    indices=[Index("trip_id")]
)
data class TripReadingEntity(
    @ColumnInfo(name="reading_id") @PrimaryKey(autoGenerate = true) val readingId: Int=0,
    @ColumnInfo(name="trip_id") val tripId: String,
    @ColumnInfo(name="recorded_at") val recordedAt: Long,
    @ColumnInfo(name="data_source") val dataSource: String?,
    val latitude: Double,
    val longitude: Double,
    val speedKmh: Float?,
    val accuracy: Float?,
    val accelerometerX: Float?,
    val accelerometerY: Float?,
    val accelerometerZ: Float?,
    val gyroscopeX: Float?,
    val gyroscopeY: Float?,
    val gyroscopeZ: Float?,
    val rpm: Int?,
    val coolantTemp: Float?,
    val fuelTrimPercent: Float?,
    val throttlePosition: Float?,
    val dtcCodes: String?,
    val synced: Boolean=false
)
