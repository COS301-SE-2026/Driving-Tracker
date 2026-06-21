package com.omnitech.drivingtracker.ui.obd
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
import com.omnitech.drivingtracker.ui.contacts.Contacts
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import com.omnitech.drivingtracker.data.models.ConsentStatus
import com.omnitech.drivingtracker.data.models.ContactDto
import com.omnitech.drivingtracker.ui.components.TopBar
import com.omnitech.drivingtracker.ui.components.BottomNavBar
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import com.omnitech.drivingtracker.ui.theme.Green
import androidx.navigation.NavController

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

    Scaffold(
        topBar = {
            TopBar(
                leftIcon = Icons.Default.ArrowBackIosNew,
                rightIcon = Icons.Default.Settings,
                onLeftClick = {},
                onRightClick = {}
            )
        },
        bottomBar = { BottomNavBar(navController = navController, color = "ach") }
    ){
        innerPadding->Column(
            modifier = Modifier.fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
        ){
        //Page Title
        Text(
            text = "OBD Diagnostics",
            fontWeight = FontWeight.Bold,
            style = MaterialTheme.typography.headlineLarge,
            color = MaterialTheme.colorScheme.onBackground,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
        )
        //Page Description
        Text(
            text = "Connect your OBD-|| adapter via Bluetooth to establish communication " +
                    "and access real-time vehicle diagnostic data.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onBackground,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
        )
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