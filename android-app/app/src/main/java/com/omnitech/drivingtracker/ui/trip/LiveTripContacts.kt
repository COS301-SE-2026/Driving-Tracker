package com.omnitech.drivingtracker.ui.trip

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBackIosNew
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
import com.omnitech.drivingtracker.R
import com.omnitech.drivingtracker.Screen
import com.omnitech.drivingtracker.data.models.TripSummaryDto
import com.omnitech.drivingtracker.ui.components.AzureMapContainer
import com.omnitech.drivingtracker.ui.components.BottomNavBar
import com.omnitech.drivingtracker.ui.components.MinimizedTrip
import com.omnitech.drivingtracker.ui.notification.NotificationViewModel
import com.omnitech.drivingtracker.ui.other.More
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import kotlinx.coroutines.delay

data class MockTrip(
    val distanceKm: Double? = 42.7,
    val durationMinutes: Int? = 38,
    val fuelEstimate: Double? = 9.4,
    val events: List<MockEvent> = listOf(
        MockEvent("HARSH_BRAKE"),
        MockEvent("HARSH_BRAKE"),
        MockEvent("HARSH_ACCELERATION")
    )
)
data class MockEvent(val eventType: String)

@Composable
fun LiveTripContacts(
    navController: NavController,
    driverName: String = "Mosa",
    tripId: String,
    viewModel: LiveTripContactViewModel = hiltViewModel(),
    onBackClick: () -> Unit = {navController.popBackStack()},
    onSettingsClick: () -> Unit = {navController.navigate(Screen.Settings.route)}
) {

    val state by viewModel.uiState.collectAsState()
    val liveDuration by viewModel.durationMinutes.collectAsState()
    val liveDistance by viewModel.distanceKm.collectAsState()
    var showTripEndDialog by remember { mutableStateOf(false) }
    var showAccessRevokedDialog by remember { mutableStateOf(false) }
    val mapToken by viewModel.mapTokenState.collectAsState()
    var recenterCount by remember { mutableStateOf(0) }

    LaunchedEffect(tripId) {
        viewModel.loadTripInfo(tripId)
        viewModel.startPolling(tripId)
    }

    LaunchedEffect(state.tripData) {
        state.tripData?.startedAt?.let { startTime ->
            viewModel.startDurationTimer(startTime)
        }
    }

    LaunchedEffect(state.location?.status) {
        if(state.location?.status == "COMPLETED") {
            showTripEndDialog = true
        }
    }

    LaunchedEffect(state.isAccessRevoked) {
        if(state.isAccessRevoked) {
            showAccessRevokedDialog = true
        }
    }

    LaunchedEffect(showAccessRevokedDialog) {
        if(showAccessRevokedDialog) {
            delay(5000)
            showAccessRevokedDialog = false
            navController.popBackStack()
        }
    }

    if(showTripEndDialog){
        AlertDialog(
            onDismissRequest = { /*User cant dismiss by tapping outside dialog */ },
            title = { Text("Trip Ended", fontWeight = FontWeight.Bold)},
            text = { Text("$driverName has arrived at their destination") },
            confirmButton = {
                Button(onClick = {
                    showTripEndDialog = false
                    navController.popBackStack()
                }) {
                    Text("OK")
                }
            }
        )
    }

    if(showAccessRevokedDialog){
        AlertDialog(
            onDismissRequest = { /*User cant dismiss by tapping outside dialog */ },
            title = { Text("Access Revoked", fontWeight = FontWeight.Bold)},
            text = { Text("$driverName stopped sharing their trip with you") },
            confirmButton = {
                Button(onClick = {
                    showAccessRevokedDialog = false
                    navController.popBackStack()
                }) {
                    Text("OK")
                }
            }
        )
    }

    Column(modifier = Modifier
        .fillMaxSize()
        .background(MaterialTheme.colorScheme.background)) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 30.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            IconButton(onClick = onBackClick)
            {
                Icon(
                imageVector = Icons.Default.ArrowBackIosNew,
                contentDescription = "Back",
                tint = MaterialTheme.colorScheme.onBackground,
                )
            }
            Row {
                Text(
                    text = "$driverName's",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = " Trip",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = MaterialTheme.colorScheme.onBackground
                )
            }
            IconButton(onClick = onSettingsClick) {
                Icon(
                    imageVector = Icons.Default.Settings,
                    contentDescription = "Settings",
                    tint = MaterialTheme.colorScheme.onBackground
                )
            }
        }
        // Map
        Box(modifier = Modifier
            .fillMaxWidth()
            .height(370.dp)
            .background(Color(0xFFD0D8E0))) {

            if(mapToken != null){

                AzureMapContainer(
                    subscriptionKey = mapToken!!,
                    latitude = state.tripData?.startLatitude?: state.location?.lastLatitude?:  -25.7479,
                    longitude = state.tripData?.startLongitude?: state.location?.lastLongitude?: 28.2293,
                    modifier = Modifier.fillMaxSize(),
                    recenterTrigger = recenterCount
                )
                IconButton(
                    onClick = { recenterCount++ },
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(16.dp)
                        .size(40.dp)
                        .background(Color.White, CircleShape)
                ) {
                    Icon(
                        imageVector = Icons.Default.MyLocation,
                        contentDescription = "Recenter",
                        tint = Color.Black
                    )
                }
            }else {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Color.White)
                }
            }

        }

        Spacer(modifier = Modifier.height(25.dp))

        TripSummaryCard(
            distanceKm = liveDistance,
            durationMinutes = liveDuration.toInt(),
            fuelEstimate = state.tripData?.fuelEstimate,
            avgSpeed = state.location?.lastSpeedKmh.toString(),
            isLive = true
        )

        Spacer(modifier = Modifier.height(12.dp))

//        TripAlertsCard(
//            hardBrakingCount = trip.events.count {it.eventType == "HARSH_BRAKE"},
//            hardAccelerationCount = trip.events.count {it.eventType == "ACCELERATION"},
//        )
        Spacer(modifier = Modifier.weight(1f))
        BottomNavBar(navController = navController, color = "trip")
            }
    }

@Preview(showBackground = true)
@Composable
fun LiveTripContactsPreview(){
    DrivingTrackerTheme{
        LiveTripContacts(navController = rememberNavController(), tripId = "")
    }
}