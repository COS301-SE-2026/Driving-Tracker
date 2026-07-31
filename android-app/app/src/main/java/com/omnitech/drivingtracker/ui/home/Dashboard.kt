package com.omnitech.drivingtracker.ui.home

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.omnitech.drivingtracker.R
import com.omnitech.drivingtracker.Screen
import com.omnitech.drivingtracker.ui.components.BottomNavBar
import com.omnitech.drivingtracker.ui.components.RecentTripCard
import com.omnitech.drivingtracker.ui.components.ScoreCard
import com.omnitech.drivingtracker.ui.components.StatCard
import com.omnitech.drivingtracker.ui.components.TopBar
import com.omnitech.drivingtracker.ui.theme.*
import androidx.compose.foundation.clickable

@Composable
fun Dashboard(navController: NavController? = null,
              dashboardViewModel: DashboardViewModel = hiltViewModel()
){
    val uiState by dashboardViewModel.uiState.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
    ) {
        Scaffold(
            topBar = {
                TopBar(
                    leftIcon = Icons.Default.Menu,
                    rightIcon = Icons.Default.Settings,
                    onLeftClick = {navController?.navigate(Screen.More.route)},
                    onRightClick = {navController?.navigate(Screen.Settings.route)}
                )
            },
            bottomBar = {
                BottomNavBar(navController = navController, color = "home")
            },
            //containerColor = Color.Transparent 
        ) { innerPadding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .padding(16.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.Top
            ) {

                // Overall driving score
                Box(
                    modifier = Modifier
                        .weight(1.3f)
                        .fillMaxWidth(),
                    contentAlignment = Alignment.Center
                ) {
                    ScoreCard(score = uiState.overallScore)
                }

                Spacer(modifier = Modifier.height(16.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "This Week",
                        style = MaterialTheme.typography.titleMedium
                    )

                    Text(
                        "vs Last Week",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.Gray
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Weekly Stats
                Column(
                    modifier = Modifier
                        .weight(1.5f)
                        .fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(
                        modifier = Modifier.weight(1f),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        StatCard(
                            label = "Distance",
                            value = uiState.weeklyDistance,
                            unit = "km",
                            icon = painterResource(id = R.drawable.stats_distance),
                            percentage = uiState.weeklyDistanceChange,
                            modifier = Modifier.weight(1f),
                            tint = Blue,
                            onClick = {}
                        )
                        StatCard(
                            label = "Driving Time",
                            value = uiState.weeklyTime,
                            unit = "mins",
                            icon = painterResource(id = R.drawable.stats_time),
                            percentage = uiState.weeklyTimeChange,
                            modifier = Modifier.weight(1f),
                            tint = Purple,
                            onClick = {}
                        )
                    }
                    Row(
                        modifier = Modifier.weight(1f),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        StatCard(
                            label = "Fuel Efficiency",
                            value = uiState.weeklyFuel,
                            unit = "km/l",
                            icon = painterResource(id = R.drawable.stats_fuel),
                            percentage = uiState.weeklyFuelChange,
                            modifier = Modifier.weight(1f),
                            tint = Green,
                            onClick = {}
                        )
                        StatCard(
                            label = "Trips",
                            value = uiState.weeklyTrips,
                            icon = painterResource(id = R.drawable.stats_trips),
                            percentage = uiState.weeklyTripsChange,
                            modifier = Modifier.weight(1f),
                            tint = Blue,
                            onClick = { navController?.navigate(Screen.Trips.route) }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "Recent trip",
                        style = MaterialTheme.typography.titleMedium
                    )

                    Text(
                        "View more",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Blue,
                        modifier = Modifier.clickable{ navController?.navigate(Screen.Trips.route) }
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))
                uiState.recentTrip?.let { trip->
                    RecentTripCard(
                        startLoc = "Last Trip",
                        destination = trip.status,
                        distance = trip.distanceKm?.toInt()?:0,
                        drivingTime = trip.durationMinutes?:0,
                        startTime = trip.startTime,
                        tripScore = trip.trip_scores?.firstOrNull()?.overallScore?.toInt()?:0,
                    )
                }?: Text(text = "No recent trips found",
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.padding(16.dp))
//                RecentTripCard(
//                    startLoc = "Home",
//                    destination = "Office",
//                    distance = 40,
//                    drivingTime = 50,
//                    startTime = "08:15",
//                    tripScore = 78
//                )
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun DashboardPreview() {
    DrivingTrackerTheme {
        Dashboard()
    }
}