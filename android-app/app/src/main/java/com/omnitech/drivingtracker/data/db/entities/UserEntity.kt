package com.omnitech.drivingtracker.data.db.entities

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName="users")
data class UserEntity(
    @ColumnInfo(name="user_id") @PrimaryKey val userID: String,
    val username: String,
    val name: String,
    val surname: String,
    val email: String
)
