package com.omnitech.drivingtracker.ui.trip

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.omnitech.drivingtracker.R
import com.omnitech.drivingtracker.Screen
import com.omnitech.drivingtracker.data.models.TripSummaryDto
import com.omnitech.drivingtracker.ui.components.BottomNavBar
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import java.util.Locale

@Composable
fun LiveTrip(
    tripId: String,
    viewModel: TripSummaryViewModel,
    navController: NavController? = null
) {
    val uiState by viewModel.uiState.collectAsState()
    val endTripState by viewModel.endTripState.collectAsState()

    LaunchedEffect(tripId) {
        if (tripId.isNotEmpty()) {
            viewModel.loadTripSummary(tripId)
        }
    }

    LaunchedEffect(endTripState) {
        val state = endTripState
        if (state is TripSummaryViewModel.UiState.Success || state is TripSummaryViewModel.UiState.Error) {
            navController?.navigate(Screen.Trips.route) {
                popUpTo(Screen.Dashboard.route)
            }
        }
    }

    LiveTripContent(
        uiState = uiState,
        endTripState = endTripState,
        onEndTrip = { viewModel.endTrip(tripId) },
        navController = navController
    )
}

@Composable
fun LiveTripContent(
    uiState: TripSummaryViewModel.UiState,
    endTripState: TripSummaryViewModel.UiState = TripSummaryViewModel.UiState.Idle,
    onEndTrip: () -> Unit = {},
    navController: NavController? = null
) {
    Column(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 30.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Icon(
                imageVector = Icons.Default.ArrowDownward,
                contentDescription = "Make smaller",
                tint = MaterialTheme.colorScheme.onBackground
            )
            Row {
                Text(
                    text = "Live Trip ",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = MaterialTheme.colorScheme.onBackground
                )
            }
            Icon(
                imageVector = Icons.Default.Settings,
                contentDescription = "Settings",
                tint = MaterialTheme.colorScheme.onBackground
            )
        }

        when (uiState){
            is TripSummaryViewModel.UiState.Loading ->{
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }

            is TripSummaryViewModel.UiState.Error ->{
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(text = uiState.message ?: "Failed to load trip", color = MaterialTheme.colorScheme.error)
                }
            }
            is TripSummaryViewModel.UiState.Success -> {
                TripDetails(
                    trip = uiState.trip,
                    endTripState = endTripState,
                    onEndTrip = onEndTrip,
                    navController = navController
                )
            }
            else -> {}
        }
    }
}

@Composable
private fun TripDetails(
    trip: TripSummaryDto,
    endTripState: TripSummaryViewModel.UiState,
    onEndTrip: () -> Unit,
    navController: NavController?
) {
    Column(modifier = Modifier.fillMaxSize()) {
        // Map
        Box(modifier = Modifier.fillMaxWidth().height(370.dp).background(Color(0xFFD0D8E0))) {
            // Map placeholder
            Image(
                painter = painterResource(id = R.drawable.map),
                contentDescription = "Trip map",
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
            // Recording badge
            Card(
                modifier = Modifier.align(Alignment.TopStart).padding(8.dp),
                shape = RoundedCornerShape(50),
                colors = CardDefaults.cardColors(containerColor = Color.Black)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(modifier = Modifier.size(8.dp).background(Color.Red, CircleShape))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Recording", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = Color.White)
                }
            }

            //Timer
            Card(
                modifier = Modifier.align(Alignment.TopEnd).padding(8.dp),
                shape = RoundedCornerShape(50),
                colors = CardDefaults.cardColors(containerColor = Color.Black)
            ) {
                Text(
                    "00:35:24", modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                    style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = Color.White
                )
            }

            //Speed and fuel for trips
            Column(
                modifier = Modifier.align(Alignment.BottomEnd).padding(8.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Card(shape = RoundedCornerShape(8.dp), colors = CardDefaults.cardColors(containerColor = Color.Black)) {
                    Row(
                        modifier = Modifier.padding(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Default.Speed,
                            contentDescription = null,
                            modifier = Modifier.size(20.dp),
                            tint = Color.White
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Column {
                            Text(
                                "20 km/h",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Bold, color = Color.White
                            )
                            Text("Speed", style = MaterialTheme.typography.labelSmall, color = Color.White)
                        }
                    }
                }
                Card(shape = RoundedCornerShape(8.dp), colors = CardDefaults.cardColors(containerColor = Color.Black)) {
                    Row(
                        modifier = Modifier.padding(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("♻\uFE0F", fontSize = 16.sp)
                        Spacer(modifier = Modifier.width(4.dp))
                        Column {
                            Text(
                                "${String.format(Locale.getDefault(), "%.1f", trip.fuelEstimate ?: 0.0)} km/l",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Bold, color = Color.White
                            )
                            Text("Fuel Efficiency", style = MaterialTheme.typography.labelSmall, color = Color.White)
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Button(
                onClick = onEndTrip,
                enabled = endTripState !is TripSummaryViewModel.UiState.Loading,
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF006400))
            ) {
                if (endTripState is TripSummaryViewModel.UiState.Loading) {
                    CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                } else {
                    Text("End Trip", color = Color.White)
                }
            }
            Button(
                onClick = {},
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF006400))
            ) {
                Icon(
                    Icons.Default.Share,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text("Share Trip", color = Color.White)
            }
        }

        Spacer(modifier = Modifier.height(25.dp))

        //Trip summary card
        Card(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFFEEEEEE)),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row {
                    Text(
                        "Trip Summary ",
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.bodyLarge
                    )
                    Text(
                        "(Live)",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    SummaryItem(String.format(Locale.getDefault(), "%.2f", trip.distanceKm ?: 0.0), "km")
                    SummaryItem("${trip.durationMinutes ?: 0}", "min")
                    SummaryItem("93", "avg speed") // Placeholder as not in DTO yet
                    SummaryItem(String.format(Locale.getDefault(), "%.1f", trip.fuelEstimate ?: 0.0), "km/l")
                }
            }
        }
        Spacer(modifier = Modifier.height(12.dp))

        //Alerts section (alerts not made but count used)
        Card(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFFEEEEEE)),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    "Alerts",
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.bodyLarge
                )
                Spacer(modifier = Modifier.height(12.dp))
                //Counting alerts from trip events
                val hardBrakingCount = trip.events.count { it.eventType=="HARD_BRAKING" }
                val hardAccelCount = trip.events.count { it.eventType=="HARD_ACCELERATION" }

                AlertItem("Hard Braking", hardBrakingCount)
                Spacer(modifier = Modifier.height(4.dp))
                AlertItem("Hard Acceleration", hardAccelCount)
            }
        }
        Spacer(modifier = Modifier.weight(1f))
        BottomNavBar(navController = navController)
    }
}

@Composable
fun SummaryItem(value: String, label: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyLarge)
        Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
fun AlertItem(label: String, count: Int) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(Icons.Default.Warning, contentDescription = null, modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.error)
        Spacer(modifier = Modifier.width(8.dp))
        Text(label, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
        Text(count.toString(), style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
    }
}

@Preview(showBackground = true)
@Composable
fun LiveTripPreview() {
    val mockTrip = TripSummaryDto(
        tripId = "123",
        vehicleId = "VW Golf",
        startedAt = "2023-10-27T10:00:00Z",
        endedAt = null,
        status = "ONGOING",
        dataSource = "PHONE",
        routePolyline = null,
        distanceKm = 15.5,
        durationMinutes = 20,
        fuelEstimate = 8.5,
        scores = null,
        events = emptyList()
    )

    DrivingTrackerTheme {
        LiveTripContent(
            uiState = TripSummaryViewModel.UiState.Success(mockTrip)
        )
    }
}
