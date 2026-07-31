package com.omnitech.drivingtracker.data.db.daos

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.omnitech.drivingtracker.data.db.entities.UserEntity

@Dao
interface UserDao {

    @Query("SELECT * FROM users WHERE user_id = :userID")
    suspend fun getUser(userID: String) : UserEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: UserEntity)

    @Delete
    suspend fun deleteUser(user: UserEntity)
}