package com.omnitech.drivingtracker.ui.obd
import com.omnitech.drivingtracker.ui.components.StandardScreen

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBackIosNew
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import com.omnitech.drivingtracker.data.models.ConsentStatus
import com.omnitech.drivingtracker.data.models.ContactDto
import com.omnitech.drivingtracker.ui.components.BottomNavBar
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import com.omnitech.drivingtracker.ui.theme.Green

import androidx.navigation.NavController
import com.omnitech.drivingtracker.ui.components.TopBar
import androidx.compose.material.icons.automirrored.filled.ArrowForwardIos
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.Thermostat
import androidx.compose.material.icons.filled.LocalGasStation
import androidx.compose.material.icons.filled.BugReport
import androidx.compose.runtime.LaunchedEffect


//key data class
data class KData(
    val name: String,
    val pid: String, //added this in case backend needs it (
    val value: String = "0", //has to be fetched at runtime
    val measurement: String,
    val pic: ImageVector
)
//key data class for the diagnostic codes
data class ErrorCode(
    val code: String,
    val description: String
)
@Composable
fun OBDKeyData(
    navController: NavController? =null,
    viewModel: ObdViewModel = hiltViewModel()) {

    LaunchedEffect(Unit){
        viewModel.loadPairedDevices()
    }

    val metrics by viewModel.vehicleMetrics.collectAsState()

    val isScanning by viewModel.isScanningFaults.collectAsState()
    val scanAttempted by viewModel.faultScanAttempted.collectAsState()

    val dat = listOf(
            //because our values can be changed
            KData("Engine RPM", "010C","${metrics.rpm}", "RPM", Icons.Default.Speed),
            KData("Coolant Temp", "0105","${metrics.coolantTemp}", "°C", Icons.Default.Thermostat),
            KData("Fuel Trim", "0103",String.format("%.1f", metrics.fuelTrim), "%", Icons.Default.LocalGasStation),
            KData("Vehicle Speed", "010D","${metrics.speed}", "km/h", Icons.Default.DirectionsCar),
    )

    val errorCodes = metrics.faultCodes.map { code ->
        ErrorCode(code, "Diagnostic Trouble Code detected")
    }

    StandardScreen(
        navController = navController,
        title = "Key Data",
        description = "View essential vehicle metrics such as engine RPM, coolant " +
        "temperature, fuel trim, and diagnostic trouble codes."
    ) {
            Button(
                onClick = {
                    viewModel.readFaultCodes() },
                enabled = !isScanning,
                modifier = Modifier.padding(16.dp)
            ){
                if(isScanning){
                    CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                    Spacer(Modifier.width(8.dp))
                    Text("Scanning car...")
                }else {
                    Text("Scan fault codes")
                }
            }
            Spacer(modifier = Modifier.height(14.dp))
            //Data (2 cards per row)
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ){
                DataCard(dat = dat[0], iconTint = MaterialTheme.colorScheme.secondary, modifier = Modifier.weight(1f)) //still need to make the actual card
                DataCard(dat = dat[1],iconTint = MaterialTheme.colorScheme.tertiary, modifier = Modifier.weight(1f))
            }
            Spacer(modifier = Modifier.height(14.dp))
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ){
                DataCard(dat = dat[2], iconTint = MaterialTheme.colorScheme.tertiary, modifier = Modifier.weight(1f))
                DataCard(dat = dat[3], iconTint = MaterialTheme.colorScheme.secondary, modifier = Modifier.weight(1f))
            }
            Spacer(modifier = Modifier.height(14.dp))

            DiagnosticsCard(codes = errorCodes, isScanning = isScanning, scanAttempted = scanAttempted)
        }
    }


@Composable
fun DataCard(dat: KData, iconTint: Color, modifier: Modifier = Modifier){
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ){
        Column(modifier = Modifier.padding(16.dp)) {
            Icon(
                imageVector = dat.pic,
                contentDescription = null,
                modifier = Modifier.size(40.dp),
                tint = iconTint
            )
            Spacer(modifier = Modifier.height(9.dp))
            Text(
                text = dat.name,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground
            )
            Text(
                text = dat.value,
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground
            )
        }
    }
}

@Composable
fun DiagnosticsCard(codes: List<ErrorCode>, isScanning: Boolean, scanAttempted: Boolean){
    Card(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ){
        Column(modifier = Modifier.padding(16.dp)){
            Row(verticalAlignment = Alignment.CenterVertically){
                    Icon(
                        imageVector = Icons.Default.BugReport,
                        contentDescription = null,
                        modifier = Modifier.size(40.dp),
                        tint = MaterialTheme.colorScheme.primary
                    )

                Spacer(modifier = Modifier.width(12.dp))

                Text(
                    text = "Diagnostic Trouble Codes",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )

            }
            Spacer(modifier = Modifier.height(12.dp))

            when{
                isScanning -> {
                    Text(
                        text = "Querying vehicle ECU, please wait...",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                codes.isNotEmpty() -> {
                    codes.forEach{ code->
                        Row(verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(vertical = 4.dp)){
                            Text(
                                text = "!",
                                color = MaterialTheme.colorScheme.error,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(end = 8.dp)
                            )
                            Text(
                                text = code.code,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(end = 8.dp),
                                color = MaterialTheme.colorScheme.onBackground
                            )
                            Text(
                                text = code.description,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onBackground
                            )
                        }
                    }
                }
                scanAttempted -> {
                    Text(
                        text = "No fault codes detected. Your vehicle system is healthy.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.primary,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                }
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun OBDKeyDataPreview() {
    DrivingTrackerTheme {
        OBDKeyData()
    }
}