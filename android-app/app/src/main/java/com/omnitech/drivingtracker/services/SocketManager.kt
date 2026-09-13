package com.omnitech.drivingtracker.services

import android.util.Log
import com.google.gson.Gson
import com.omnitech.drivingtracker.BuildConfig
import com.omnitech.drivingtracker.data.local.SessionManager
import com.omnitech.drivingtracker.data.models.SocketLocationPayload
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SocketManager @Inject constructor(private val sessionManager: SessionManager, private val gson: Gson){

    private var socket: Socket? = null
    private val TAG = "SocketManager"

    fun connect(){
        if(socket?.connected() == true) return

        try{
            val opts = IO.Options().apply{
                auth = mapOf("token" to sessionManager.getAccessToken())
            }
            val cleanUrl = BuildConfig.BASE_URL.removeSuffix("/")
            socket = IO.socket(cleanUrl, opts)

            socket?.on(Socket.EVENT_CONNECT){
                Log.d(TAG, "Socket.io Connected")
            }

            socket?.on(Socket.EVENT_DISCONNECT){
                Log.d(TAG, "Socket.io Disconnected")
            }

            socket?.on("error") { args ->
                val error = args[0] as? JSONObject
                Log.e(TAG, "Socket Error: $error")
            }

            socket?.connect()
        } catch(e: Exception){
            Log.e(TAG, "Failed to initialize socket: ${e.message}")
        }
    }

    fun joinTrip(tripId: String){
        Log.d(TAG, "Emitting join_trip for: $tripId")
        socket?.emit("join_trip", tripId)
    }

    fun leaveTrip(tripId: String){
        Log.d(TAG, "Emitting leave_trip for: $tripId")
        socket?.emit("leave_trip", tripId)
    }

    fun sendLocationUpdate(payload: SocketLocationPayload){

        val jsonString = gson.toJson(payload)
        val jsonObject = JSONObject(jsonString)

        socket?.emit("location:update", jsonObject)
        Log.d(TAG, "Location update sent: ${payload.location.lat} : ${payload.location.lng}")
    }

    fun onLocationUpdate(onUpdate: (SocketLocationPayload) -> Unit){
        socket?.on("location:update"){ args ->
            val data = args[0] as? JSONObject
            data?.let{
                try{
                    val payload = gson.fromJson(it.toString(), SocketLocationPayload::class.java)
                    onUpdate(payload)
                } catch(e: Exception){
                    Log.e(TAG, "Failed to parse incoming location update", e)
                }
            }
        }
    }

    fun offLocationUpdate(){
        socket?.off("location:update")
    }

    fun disconnect(){
        socket?.disconnect()
        socket = null
    }

}