package com.omnitech.drivingtracker.ui.obd

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.ui.Alignment

data class LiveWarning(
    val title: String,
    val description: String,
)

@Composable
fun OBDLiveWarnings(navController: NavController? =null){

    //mock warnings
    val warnings = remember{
        listOf(
            LiveWarning(
                title = "Check Engine/Malfunction indicator Lamp (MIL)",
                description = "Indicates the engine is getting too much air and not enough fuel."
            ),
            LiveWarning(
                title = "Check Engine/Malfunction indicator Lamp (MIL)",
                description = "Indicates the engine is getting too much air and not enough fuel."
            ),
            LiveWarning(
                title = "Check Engine/Malfunction indicator Lamp (MIL)",
                description = "Indicates the engine is getting too much air and not enough fuel."
            )

        )
    }

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
                text = "Live Warnings",
                fontWeight = FontWeight.Bold,
                style = MaterialTheme.typography.headlineLarge,
                color = MaterialTheme.colorScheme.onBackground,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
            )
            //Page Description
            Text(
                text = "Monitor incoming diagnostic data and receive instant alerts when " +
                        "potential mechanical or performance issues arise.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onBackground,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
            )

            Spacer(modifier = Modifier.height(14.dp))

            //No warnings
            if (warnings.isEmpty()){
                Box(
                    modifier = Modifier.fillMaxWidth().padding(top = 64.dp),
                    contentAlignment = Alignment.Center
                ){
                    Text(
                        text = "No Live Warnings available",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.Black
                    )
                }
            }
            else{
                warnings.forEach{
                    warning->WarningCard(warning = warning)
                    Spacer(modifier = Modifier.height(14.dp))
                }
            }
        }
    }
}

@Composable
fun WarningCard(warning: LiveWarning){
    Card(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ){
        Column(
            modifier = Modifier.padding(16.dp)
        ){
            Text(
                text = warning.title,
                fontWeight = FontWeight.Bold,
                color = Color.Red,
                style = MaterialTheme.typography.bodyMedium
            )

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Bottom
            ){
                Text(
                    text = warning.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.Black,
                    modifier = Modifier.weight(1f)
                )

                Spacer(modifier = Modifier.width(8.dp))

                Text(
                    text = "See more",
                    style = MaterialTheme.typography.bodySmall,
                    fontWeight = FontWeight.SemiBold,
                    color = Color.Blue
                )
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun OBDLiveWarningsPreview() {
    DrivingTrackerTheme {
        OBDLiveWarnings()
    }
}