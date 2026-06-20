package com.omnitech.drivingtracker.data.obd

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothSocket
import android.content.Context
import android.util.Log
import com.github.pires.obd.commands.protocol.EchoOffCommand
import com.github.pires.obd.commands.protocol.LineFeedOffCommand
import com.github.pires.obd.commands.protocol.SelectProtocolCommand
import com.github.pires.obd.commands.protocol.TimeoutCommand
import com.github.pires.obd.enums.ObdProtocols
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ObdManager @Inject constructor(@ApplicationContext private val context: Context){
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
        try{
            val out = socket?.outputStream ?: return
            val `in` = socket?.inputStream ?: return

            //send AT commands to reset and setup protocol
            //prelim commands

            //stop repeating commands back
            EchoOffCommand().run(`in`, out)

            //stop adding extra empty lines
            LineFeedOffCommand().run(`in`, out)

            //millisecond wait time for answers
            TimeoutCommand(125).run(`in`, out)

            //scan cars computer to figure out language used
            SelectProtocolCommand(ObdProtocols.AUTO).run(`in`, out)

            Log.d("OBD_LOG", "OBD Protocol Initialized Successfully")
        }catch(e: Exception){
            Log.e("OBD_LOG", "Failed to initialize OBD protocol", e)
        }

    }

    //get already paired devices
    fun getPairedDevices(): List<android.bluetooth.BluetoothDevice>{
        return try{
            bluetoothAdapter?.bondedDevices?.toList() ?: emptyList()
        }catch(e: SecurityException){
            emptyList()
        }
    }

    //start looking for new nearby devices
    fun startDiscovery(){
        try{
            if(bluetoothAdapter?.isDiscovering == true){
                bluetoothAdapter.cancelDiscovery()
            }
            bluetoothAdapter?.startDiscovery()
        }catch(e: SecurityException){
            
        }
    }
}