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

//data class representing live state of vehicle
data class VehicleMetrics(
    val rpm: Int = 0,
    val speed: Int = 0,
    val coolantTemp: Int = 0,
    val fuelTrim: Double = 0.0,
    val faultCodes: List<String> = emptyList(),
    val isDataLive: Boolean = false
)

@Singleton
class ObdManager @Inject constructor(@param:ApplicationContext private val context: Context){

    //get fault codes (DTCs)
    suspend fun fetchTroubleCodes() = withContext(Dispatchers.IO){
        val out = socket?.outputStream?:return@withContext
        val inputStream = socket?.inputStream?:return@withContext

        val codesCmd = TroubleCodesCommand()

        try{
            codesCmd.run(inputStream, out)
            //the library returns a raw String code
            //split it into a list
            val result = codesCmd.formattedResult
            val codeList = if(result.isNullOrBlank()){
                emptyList()
            }else{
                result.split("\n", ",").map{it.trim()}.filter{it.isNotEmpty()}
            }
            _metrics.value = _metrics.value.copy(faultCodes = codeList)

            Log.d("OBD_LOG", "Found ${codeList.size} trouble codes")
            // testing log
            Log.d("OBD_TEST", "FAULT CODES FOUND: $codeList")
        }catch(e: Exception){
            Log.e("OBD_LOG", "Failed to fetch trouble codes", e)
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
        val out = socket?.outputStream ?: return@withContext
        val inputStream = socket?.inputStream ?: return@withContext

        //initialize commands
        val rpmCmd = RPMCommand()
        val speedCmd = SpeedCommand()
        val coolantCmd = EngineCoolantTemperatureCommand()
        val fuelTrimCmd = FuelTrimCommand(FuelTrim.LONG_TERM_BANK_1)

        while (_connectionState.value == ConnectionState.CONNECTED) {
            try {
                runCatching{ rpmCmd.run(inputStream, out) }
                runCatching { speedCmd.run(inputStream, out) }
                val coolantResult = runCatching{ coolantCmd.run(inputStream, out) }
                val fuelResult = runCatching{ fuelTrimCmd.run(inputStream, out) }

                _metrics.value = VehicleMetrics(
                    rpm = rpmCmd.rpm,
                    speed = speedCmd.metricSpeed,
                    coolantTemp = if(coolantResult.isSuccess) coolantCmd.temperature.toInt() else 0,
                    fuelTrim = if (fuelResult.isSuccess) fuelTrimCmd.value.toDouble() else 0.0,
                    faultCodes = _metrics.value.faultCodes,
                    isDataLive = true
                )
                // testing logs
                //Log.d("OBD_TEST", "LIVE DATA -> RPM: ${rpmCmd.rpm}, Speed: ${speedCmd.metricSpeed}")

                delay(500)
            } catch (e: Exception) {
                Log.e("OBD_LOOP", "Failed to fetch metrics. Critical error", e)
                _metrics.value = _metrics.value.copy(isDataLive = false)
                break
            }
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