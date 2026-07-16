package com.omnitech.drivingtracker.ui.obd
import com.omnitech.drivingtracker.ui.components.StandardScreen
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBackIosNew
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import com.omnitech.drivingtracker.ui.components.BottomNavBar
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import com.omnitech.drivingtracker.data.models.ConsentStatus
import com.omnitech.drivingtracker.data.models.ContactDto
import com.omnitech.drivingtracker.ui.components.TopBar
import com.omnitech.drivingtracker.ui.theme.Green
import androidx.navigation.NavController
import androidx.compose.ui.draw.clip
import androidx.compose.material.icons.filled.Bluetooth
//import androidx.glance.appwidget.compose
import com.omnitech.drivingtracker.data.obd.ObdManager
import android.provider.Settings
import androidx.compose.ui.platform.LocalContext
import android.content.Intent
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import android.bluetooth.BluetoothDevice
import androidx.compose.runtime.DisposableEffect

data class Device(
    val name: String,
    val isConnected: Boolean,
    val address: String,
    val adapter: String,
    val signalStrength: String? = null,
    val lastUsed: String? = null

)
@Composable
fun OBDConnect(navController: NavController? =null,
               viewModel: ObdViewModel = hiltViewModel()){

    val context = LocalContext.current
    val bluetoothDevices by viewModel.pairedDevices.collectAsState() // Real data
    val connectionState by viewModel.connectionState.collectAsState() //real status

    val connectedAddress by viewModel.connectedDeviceAddress.collectAsState()
    //transform bluetoothDevice since viewModel provides list but UI expects Device objects
    val uiDevices = bluetoothDevices.map{btDevice: BluetoothDevice ->
        Device(
            name = try { btDevice.name } catch (e: SecurityException) { null } ?: "Unknown Device",
            address = btDevice.address, //this is MAC address
            isConnected = connectionState == ObdManager.ConnectionState.CONNECTED && btDevice.address == connectedAddress,
            adapter = "ELM327"
        )
    }

    //Automatically refresh the devices  list when the user returns to this screen
    val lifecycleOwner = androidx.lifecycle.compose.LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = androidx.lifecycle.LifecycleEventObserver { _, event ->
            if (event == androidx.lifecycle.Lifecycle.Event.ON_RESUME){
                viewModel.loadPairedDevices()
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
        }
    }

    StandardScreen(
        navController = navController,
        title = "OBD Connections",
        description = "Connect your OBD-|| Adapter via bluetooth to establish communication and access real-time vehicle diagnostic data."
    ){

        //Devices
        Text(
            text = "My Devices",
            fontWeight = FontWeight.Bold,
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.onBackground,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
        )
        //Add Device Button
        OutlinedButton(
            onClick = {
                val intent = Intent(Settings.ACTION_BLUETOOTH_SETTINGS)
                context.startActivity(intent)
            },
            shape = RoundedCornerShape(50),
            modifier = Modifier.padding(horizontal = 16.dp),
            border = ButtonDefaults.outlinedButtonBorder(enabled = true),
        ) {
            Text(text = "Add Device")
        }

        Spacer(modifier = Modifier.height(16.dp))

        //for each device that is available, show a card
        uiDevices.forEach { device: Device ->
            DeviceCard(
                device = device,
                onConnect = { viewModel.connectToObd(device.address) }
            )
            Spacer(modifier = Modifier.height(12.dp))
        }

    }

}

@Composable
fun DeviceCard(device: Device, onConnect: () -> Unit){

    Card(
        modifier = Modifier.fillMaxWidth()
            .padding(horizontal = 16.dp),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFEEEEEE)),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ){
        Row(modifier = Modifier.fillMaxWidth().padding(16.dp)){
            Icon(
                imageVector = Icons.Default.Bluetooth,
                contentDescription = null,
                modifier = Modifier.padding(top = 2.dp)
            )

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)){
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ){
                    Text(text = device.name, fontWeight = FontWeight.Bold)

                    //only disconnected devices have a connect button
                    if (!device.isConnected){
                        Button(
                            onClick = onConnect,
                            shape = RoundedCornerShape(50),
                            colors = ButtonDefaults.buttonColors(containerColor = Green)
                        ){
                            Text("Connect")
                        }
                    }
                }
                Spacer(modifier = Modifier.height(4.dp))

                //Connected or not
                Row(verticalAlignment = Alignment.CenterVertically){
                    Box(
                        modifier = Modifier.size(8.dp).clip(CircleShape)
                            .background(if (device.isConnected) Green else Color(0xFFC62828))
                    )
                    Spacer (modifier = Modifier.width(6.dp))
                    Text(text = if (device.isConnected)
                        "Connected"
                        else "Disconnected")
                }
                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = "Adapter: ${device.adapter}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                //only show signal strength if the device is connected
                device.signalStrength?.let{
                    Text(
                        text = "Signal Strength: $it",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                //only show last used when the device is not connected
                device.lastUsed?.let{
                    Text(
                        text = "Last Used: $it",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}
@Preview(showBackground = true)
@Composable
fun OBDConnectPreview() {
    DrivingTrackerTheme {
        OBDConnect()
    }
}