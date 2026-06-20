package com.omnitech.drivingtracker.ui.obd

import android.bluetooth.BluetoothDevice
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.omnitech.drivingtracker.data.local.SessionManager
import com.omnitech.drivingtracker.data.obd.ObdManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ObdViewModel(
    private val obdManager: ObdManager,
    private val sessionManager: SessionManager
): ViewModel(){
    //list UI will show
    private val _pairedDevices = MutableStateFlow<List<BluetoothDevice>>(emptyList())
    val pairedDevices = _pairedDevices.asStateFlow()

    //expose connection state from manager to UI
    val connectionState = obdManager.connectionState

    init{
        loadPairedDevices()
        attemptAutoConnect()
    }

    fun loadPairedDevices(){
        val allDevices = obdManager.getPairedDevices()
        //filter for common obd names for ease of use
        _pairedDevices.value = allDevices.filter{ device ->
            try {
                val name = device.name ?: ""
                name.contains("OBD", ignoreCase = true) ||
                        name.contains("ELM", ignoreCase = true)
            }catch(e: SecurityException){
                false
            }
        }
    }

    private fun attemptAutoConnect(){
        val lastAddress = sessionManager.getLastObdAddress()
        if(lastAddress != null){
            connectToObd(lastAddress)
        }
    }

    fun connectToObd(address: String){
        viewModelScope.launch{
            obdManager.connectToDevice(address)

            //if connection successful, save for next time
            if(obdManager.connectionState.value == ObdManager.ConnectionState.CONNECTED){
                sessionManager.saveLastObdAddress(address)
            }
        }
    }
}

class ObdViewModelFactory(
    private val obdManager: ObdManager,
    private val sessionManager: SessionManager
): ViewModelProvider.Factory{
    override fun <T: ViewModel> create(modelClass: Class<T>): T{
        if(modelClass.isAssignableFrom(ObdViewModel::class.java)){
            @Suppress("UNCHECKED_CAST")
            return ObdViewModel(obdManager, sessionManager) as T
        }
        throw IllegalArgumentException("Unknown ViewModel Class")
    }
}