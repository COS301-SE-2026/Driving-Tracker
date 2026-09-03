package com.omnitech.drivingtracker.data.local

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import androidx.core.content.edit
import com.google.gson.Gson
import com.google.gson.JsonObject
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton
import android.util.Base64
import android.util.Log

@Singleton
class SessionManager @Inject constructor(@ApplicationContext context: Context) {
    private val prefs= EncryptedSharedPreferences.create(
        context,
        "secure_prefs",
        MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun saveTokens(accessToken:  String, refreshToken: String){

        prefs.edit {
            putString("token", accessToken)
            putString("refresh_token", refreshToken)
        }
    }

    fun getAccessToken(): String? = prefs.getString("token", null)
    fun getRefreshToken(): String? = prefs.getString("refresh_token", null)

    fun clearTokens(){
        prefs.edit { remove("token").remove("refresh_token") }
    }

    fun saveLastObdAddress(address: String){
        prefs.edit{putString("last_obd_address", address)}
    }

    fun getLastObdAddress(): String? {
        return prefs.getString("last_obd_address", null)
    }

    fun setNotificationRequested(){
        prefs.edit{ putBoolean("notification_requested", true) }
    }

    fun hasRequestedNotification(): Boolean {
        return prefs.getBoolean("notification_requested", false)
    }

    fun setBluetoothRequested(){
        prefs.edit{ putBoolean("bluetooth_requested", true)}
    }

    fun hasRequestedBluetooth() : Boolean {
        return prefs.getBoolean("bluetooth_requested", false)
    }

    fun saveFcmToken(token: String) {
        prefs.edit { putString("fcm_token", token) }
    }

    fun getFcmToken(): String? {
        return prefs.getString("fcm_token", null)
    }

    fun saveUserId(userId: String) {
        prefs.edit { putString("user_id", userId)}
    }

    fun getUserId(): String? {
        return prefs.getString("user_id", null)
    }

    fun getUserIdFromToken(): String? {
        val token = getAccessToken() ?: return null
        return try{
            val parts = token.split(".")
            if (parts.size < 2) return null

            val payload = String(Base64.decode(parts[1], Base64.URL_SAFE))

            val jsonObject = Gson().fromJson(payload, JsonObject::class.java)
            jsonObject.get("sub")?.asString

        }catch(e: Exception){
            null
        }
    }
}