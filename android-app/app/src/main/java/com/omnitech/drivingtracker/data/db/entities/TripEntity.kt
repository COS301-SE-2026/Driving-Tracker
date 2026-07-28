package com.omnitech.drivingtracker.data.db.entities

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.PrimaryKey
import androidx.room.Index

@Entity(tableName = "trips",
    foreignKeys=[ForeignKey(
        entity = UserEntity::class,
        parentColumns = ["user_id"],
        childColumns = ["user_id"],
        onDelete = ForeignKey.CASCADE
        )
    ],
    indices=[Index("user_id")]
)
data class TripEntity(
    @ColumnInfo("trip_id") @PrimaryKey val tripId: String,
    @ColumnInfo("user_id") val userId: String,
    val vehicleId: String?,
    val startTime: Long?,
    val endTime: Long? = null,
    val startLatitude: Double?,
    val startLongitude: Double?,
    val endLatitude: Double? = null,
    val endLongitude: Double? = null,
    val distanceKm: Double? = null,
    val durationMinutes: Int? = null,
    val status: String?,
    val routeGeoJson: String? = null,
    val synced: Boolean = false
)
