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
    val endTime: Long?,
    val startLatitude: Double?,
    val startLongitude: Double?,
    val endLatitude: Double?,
    val endLongitude: Double?,
    val distanceKm: Double?,
    val durationMinutes: Int?,
    val status: String?,
    val routeGeoJson: String?
)
