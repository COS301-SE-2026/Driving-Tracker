package com.omnitech.drivingtracker.ui.obd

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
fun OBDKeyData(navController: NavController? =null) {

    //mock data for ui
    val dat = remember {
        mutableStateListOf(
            //because our values can be changed
            KData("Engine RPM", "010C","0", "RPM", Icons.Default.Speed),
            KData("Coolant Temp", "0105","0", "*C", Icons.Default.Thermostat),
            KData("Fuel System Status", "0103","0", "", Icons.Default.LocalGasStation),
            KData("Vehicle Speed", "010D","0", "km/h", Icons.Default.DirectionsCar),
        )
    }

    val ErrorCodes = listOf(
        ErrorCode("P0300", "Randome Cyliner Misfire Detected"),
        ErrorCode("P0300", "Multiple Cyliner Misfire Detected")
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
    ) { innerPadding ->
        Column(
            modifier = Modifier.fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
        ) {
            //Page Title
            Text(
                text = "Key Data",
                fontWeight = FontWeight.Bold,
                style = MaterialTheme.typography.headlineLarge,
                color = MaterialTheme.colorScheme.onBackground,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
            )
            //Page Description
            Text(
                text = "View essential vehicle metrics such as engine RPM, coolant " +
                        "temperature, fuel trim, and diagnostic trouble codes.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onBackground,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
            )
            Spacer(modifier = Modifier.height(12.dp))
            //Data (2 cards per row)
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ){
                DataCard(dat = dat[0], modifier = Modifier.weight(1f)) //still need to make the actual card
                DataCard(dat = dat[1], modifier = Modifier.weight(1f))
            }
            Spacer(modifier = Modifier.height(14.dp))
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ){
                DataCard(dat = dat[2], modifier = Modifier.weight(1f))
                DataCard(dat = dat[3], modifier = Modifier.weight(1f))
            }
            Spacer(modifier = Modifier.height(14.dp))

            DiagnosticsCard(codes = ErrorCodes)
        }
    }
}

@Composable
fun DataCard(dat: KData, modifier: Modifier = Modifier){
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
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(9.dp))
            Text(
                text = dat.name,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = dat.value,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun DiagnosticsCard(codes: List<ErrorCode>){
    Card(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ){
        Column(modifier = Modifier.padding(16.dp)){
            Row(verticalAlignment = Alignment.CenterVertically){
                Box(
                    modifier = Modifier.size(width = 80.dp, height =56.dp),
                    contentAlignment = Alignment.Center
                ){
                    Icon(
                        imageVector = Icons.Default.BugReport,
                        contentDescription = null,
                        modifier = Modifier.size(40.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Spacer(modifier = Modifier.width(12.dp))

                Text(
                    text = "Diagnostic Trouble Codes",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )

            }
            Spacer(modifier = Modifier.height(12.dp))

            codes.forEach{ code->
                Row(verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(vertical = 4.dp)){
                    Text(
                        text = "!",
                        color = Color.Red,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(end = 8.dp)
                    )
                    Text(
                        text = code.code,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(end = 8.dp)
                    )
                    Text(
                        text = code.description,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
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