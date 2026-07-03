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
import com.omnitech.drivingtracker.ui.components.TopBar
import com.omnitech.drivingtracker.ui.theme.Green
import androidx.navigation.NavController
import androidx.compose.ui.draw.clip
import androidx.compose.material.icons.filled.Bluetooth

data class Device(
    val name: String,
    val isConnected: Boolean,
    val adapter: String,
    val signalStrength: String? = null,
    val lastUsed: String? = null

)
@Composable
fun OBDConnect(navController: NavController? =null){

    val devices = listOf(
        Device("OBD 1", isConnected = true, adapter = "ELM327", signalStrength="Good"),
        Device("OBD 2", isConnected = false, adapter = "ELM327", lastUsed="31 May 2026"),
        Device("OBD 3", isConnected = false, adapter = "ELM327", lastUsed="12 January 2025")
    )

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
            onClick = {/* pair */},
            shape = RoundedCornerShape(50),
            modifier = Modifier.padding(horizontal = 16.dp),
            border = ButtonDefaults.outlinedButtonBorder(enabled = true),
        ) {
            Text(text = "Add Device")
        }

        Spacer(modifier = Modifier.height(16.dp))

        //for each device that is available, show a card
        devices.forEach{
            device -> DeviceCard(device)
            Spacer(modifier = Modifier.height(12.dp))
        }

    }

}

@Composable
fun DeviceCard(device: Device){

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
                            onClick = {/*pair*/},
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