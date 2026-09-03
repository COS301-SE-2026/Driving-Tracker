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
import com.github.pires.obd.commands.engine.RPMCommand
import com.github.pires.obd.commands.SpeedCommand
import com.github.pires.obd.commands.temperature.EngineCoolantTemperatureCommand
import com.github.pires.obd.commands.fuel.FuelTrimCommand
import com.github.pires.obd.enums.FuelTrim
import kotlinx.coroutines.delay
import com.github.pires.obd.commands.control.TroubleCodesCommand
import com.github.pires.obd.commands.protocol.ResetTroubleCodesCommand
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import com.github.pires.obd.commands.control.VinCommand
import com.github.pires.obd.commands.fuel.FuelLevelCommand
//data class representing live state of vehicle
data class VehicleMetrics(
    val rpm: Int = 0,
    val speed: Int = 0,
    val coolantTemp: Int = 0,
    val fuelTrim: Double = 0.0,
    val fuelLevel: Float? = 0.0f,
    val faultCodes: List<String> = emptyList(),
    val vin: String = "",
    val isDataLive: Boolean = false
)

@Singleton
class ObdManager @Inject constructor(@param:ApplicationContext private val context: Context){

    private val socketMutex = Mutex() // Prevents command collisions

    suspend fun fetchVin() = withContext(Dispatchers.IO){
        socketMutex.withLock {
            val out = socket?.outputStream?:return@withContext
            val inputStream = socket?.inputStream?:return@withContext

            try{
                delay(500)
                val vinCmd = VinCommand()
                vinCmd.run(inputStream, out)

                val vinResult = vinCmd.formattedResult

                _metrics.value = _metrics.value.copy(vin = vinResult)
                Log.d("OBD_LOG", "Successfulyl retrived VIN: $vinResult")
            }catch(e: Exception){
                Log.e("OBD_LOG", "Failed to fetch VIN", e)
                _metrics.value = _metrics.value.copy(vin = "Unknown")
            }
        }
    }
    private var isLoopRunning = false
    //get fault codes (DTCs)
    suspend fun fetchTroubleCodes() = withContext(Dispatchers.IO){
        socketMutex.withLock{
            val out = socket?.outputStream?:return@withContext
            val inputStream = socket?.inputStream?:return@withContext

            try{
                val codesCmd = TroubleCodesCommand()
                codesCmd.run(inputStream, out)
                //the library returns a raw String code
                //split it into a list
                val result = codesCmd.formattedResult

                val codeList = if(result.isNullOrBlank() || result.contains("No data", ignoreCase = true)){
                    emptyList()
                }else{
                    result.split("\n", ",").map{it.trim()}.filter{it.length>=4 && it!="NODATA"}
                }
                _metrics.value = _metrics.value.copy(faultCodes = codeList)

                Log.d("OBD_LOG", "Found ${codeList.size} trouble codes")
                // testing log
                Log.d("OBD_TEST", "FAULT CODES FOUND: $codeList")
            }catch(e: Exception){
                Log.e("OBD_LOG", "Failed to fetch trouble codes", e)
                if(e is java.io.IOException){
                    _connectionState.value = ConnectionState.DISCONNECTED
                    _connectedDeviceAddress.value = null
                }
            }
        }
    }
    suspend fun fetchFuelLevel(): Float? = withContext(Dispatchers.IO){
        val out = socket?.outputStream?: return@withContext null
        val input = socket?.inputStream?: return@withContext null
        //the fuel level will be returned as a percentage

        try{
            val fuelCmd = FuelLevelCommand()
            fuelCmd.run(input,out)
            val level = fuelCmd.fuelLevel
            _metrics.value = _metrics.value.copy(fuelLevel = level)
            Log.d("OBD_LOG", "Fuel Level fetched: $level%")
            level
        }catch (e: Exception){
            Log.e("OBD_LOG", "Failed to fetch fuel level", e)
            null
        }
    }
    suspend fun clearTroubleCodes() = withContext(Dispatchers.IO){
        val out = socket?.outputStream?: return@withContext
        val inputStream = socket?.inputStream?: return@withContext

        try{
            //Mode 04 reset
            ResetTroubleCodesCommand().run(inputStream, out)
            //clear local list in state so UI updates immediately
            _metrics.value = _metrics.value.copy(faultCodes = emptyList())

            Log.d("OBD_LOG", "Trouble codes cleared successfully")
        }catch(e: Exception){
            Log.e("OBD_LOG", "Failed to clear codes", e)
        }
    }

    //create stateflow for metrics
    private val _metrics = MutableStateFlow(VehicleMetrics())
    val metrics: StateFlow<VehicleMetrics> = _metrics.asStateFlow()

    //start continuous loop to poll data from vehicle
    suspend fun startLiveDataLoop() = withContext(Dispatchers.IO) {
        //prevent multiple instances of the loop from running simultaneously
        if(isLoopRunning) return@withContext
        isLoopRunning = true

        try{
            //initialize commands
            val rpmCmd = RPMCommand()
            val speedCmd = SpeedCommand()
            val coolantCmd = EngineCoolantTemperatureCommand()
            val fuelTrimCmd = FuelTrimCommand(FuelTrim.LONG_TERM_BANK_1)

            while (_connectionState.value == ConnectionState.CONNECTED) {
                val out = socket?.outputStream ?: return@withContext
                val inputStream = socket?.inputStream ?: return@withContext
                try {
                    //use mutex to prevent collision with fetchTroubleCodes or clearTroubleCodes
                    socketMutex.withLock {
                        runCatching{ rpmCmd.run(inputStream, out) }
                        runCatching { speedCmd.run(inputStream, out) }
                        runCatching{ coolantCmd.run(inputStream, out) }
                        runCatching{ fuelTrimCmd.run(inputStream, out) }
                    }
                    //update metrics while preserving existing fault codes
                    _metrics.value = _metrics.value.copy(
                        rpm = rpmCmd.rpm,
                        speed = speedCmd.metricSpeed,
                        coolantTemp = try{ coolantCmd.temperature.toInt() }catch(e: Exception){ _metrics.value.coolantTemp},
                        fuelTrim = try{ fuelTrimCmd.value.toDouble()}catch(e: Exception){ _metrics.value.fuelTrim },
                        //faultCodes = _metrics.value.faultCodes,
                        isDataLive = true
                    )
                    // testing logs
                    //Log.d("OBD_TEST", "LIVE DATA -> RPM: ${rpmCmd.rpm}, Speed: ${speedCmd.metricSpeed}")

                    delay(500)
                } catch (e: Exception) {
                    Log.e("OBD_LOOP", "Failed to fetch metrics, retrying...", e)
                    _connectionState.value = ConnectionState.DISCONNECTED
                    _connectedDeviceAddress.value = null
                    break
                }
            }
        }finally{
            isLoopRunning = false
            _metrics.value = _metrics.value.copy(isDataLive = false)
        }
    }

    private val bluetoothAdapter: BluetoothAdapter? =
        (context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager).adapter
    private var socket: BluetoothSocket? = null

    //uuid for ELM adapter using SPP
    private val obdUuid = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")

    //state flow to enable UI to collect connection status
    private val _connectionState = MutableStateFlow(ConnectionState.DISCONNECTED)
    val connectionState = _connectionState.asStateFlow()

    private val _connectedDeviceAddress = MutableStateFlow<String?>(null)
    val connectedDeviceAddress = _connectedDeviceAddress.asStateFlow()

    enum class ConnectionState {DISCONNECTED, CONNECTING, CONNECTED, ERROR}

    suspend fun connectToDevice(address: String) = withContext(Dispatchers.IO){
        val device = bluetoothAdapter?.getRemoteDevice(address) ?: return@withContext

        try{
            _connectionState.value = ConnectionState.CONNECTING
            socket = device.createInsecureRfcommSocketToServiceRecord(obdUuid)
            socket?.connect()

            //initialize commands for ELM
            initializeObd()

            _connectedDeviceAddress.value = address
            _connectionState.value = ConnectionState.CONNECTED
        }catch(e: Exception) {
            _connectionState.value = ConnectionState.ERROR
            _connectedDeviceAddress.value = null
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
            //Log.d("OBD Load", "Get paired devices")
            bluetoothAdapter?.bondedDevices?.toList() ?: emptyList()
        }catch(e: SecurityException){
            //Log.d("OBD Load", e.message?:"Paired devices error OBD")
            emptyList()
        }
    }
}