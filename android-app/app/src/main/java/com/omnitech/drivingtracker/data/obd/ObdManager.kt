package com.omnitech.drivingtracker.data.obd

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothSocket
import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import java.util.UUID

class ObdManager(private val context: Context){
    private val bluetoothAdapter: BluetoothAdapter? =
        (context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager).adapter
    private var socket: BluetoothSocket? = null

    //uuid for ELM adapter using SPP
    private val obdUuid = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")

    //state flow to enable UI to collect connection status
    private val _connectionState = MutableStateFlow(ConnectionState.DISCONNECTED)
    val connectionState = _connectionState.asStateFlow()

    enum class ConnectionState {DISCONNECTED, CONNECTING, CONNECTED, ERROR}

    suspend fun connectToDevice(address: String) = withContext(Dispatchers.IO){
        val device = bluetoothAdapter?.getRemoteDevice(address) ?: return@withContext

        try{
            _connectionState.value = ConnectionState.CONNECTING
            socket = device.createInsecureRfcommSocketToServiceRecord(obdUuid)
            socket?.connect()

            //initialize commands for ELM
            initializeObd()

            _connectionState.value = ConnectionState.CONNECTED
        }catch(e: Exception) {
            _connectionState.value = ConnectionState.ERROR
            socket?.close()
        }
    }

    private fun initializeObd(){
        val inputStream = socket?.inputStream
        val outputStream = socket?.outputStream

        //send AT commands to reset and setup protocol
    }

    fun getPairedDevices(): List<android.bluetooth.BluetoothDevice>{
        return try{
            bluetoothAdapter?.bondedDevices?.toList() ?: emptyList()
        }catch(e: SecurityException){
            emptyList()
        }
    }
}