package com.omnitech.drivingtracker.data.local

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import androidx.core.content.edit
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

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
        prefs.edit { clear() }
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
}