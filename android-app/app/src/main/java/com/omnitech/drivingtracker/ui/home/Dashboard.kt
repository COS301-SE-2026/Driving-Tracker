package com.omnitech.drivingtracker.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.omnitech.drivingtracker.R
import com.omnitech.drivingtracker.ui.components.BottomNavBar
import com.omnitech.drivingtracker.ui.components.RecentTripCard
import com.omnitech.drivingtracker.ui.components.ScoreCard
import com.omnitech.drivingtracker.ui.components.StatCard
import com.omnitech.drivingtracker.ui.components.TopBar
import com.omnitech.drivingtracker.ui.theme.*

@Composable
fun Dashboard(navController: NavController? = null,
              dashboardViewModel: DashboardViewModel = hiltViewModel()
){
    val recentTrip by dashboardViewModel.recentTrip.collectAsState();
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
                    onLeftClick = { /* Open menu */ },
                    onRightClick = { /* Open settings */ }
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
                    ScoreCard(score = 85)
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
                            value = 250,
                            unit = "km",
                            icon = painterResource(id = R.drawable.stats_distance),
                            percentage = 5,
                            modifier = Modifier.weight(1f),
                            tint = Blue
                        )
                        StatCard(
                            label = "Driving Time",
                            value = 25,
                            unit = "mins",
                            icon = painterResource(id = R.drawable.stats_time),
                            percentage = -5,
                            modifier = Modifier.weight(1f),
                            tint = Purple
                        )
                    }
                    Row(
                        modifier = Modifier.weight(1f),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        StatCard(
                            label = "Fuel Efficiency",
                            value = 250,
                            unit = "km/l",
                            icon = painterResource(id = R.drawable.stats_fuel),
                            percentage = 5,
                            modifier = Modifier.weight(1f),
                            tint = Green
                        )
                        StatCard(
                            label = "Trips",
                            value = 15,
                            icon = painterResource(id = R.drawable.stats_trips),
                            percentage = 5,
                            modifier = Modifier.weight(1f),
                            tint = Blue
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
                        color = Blue
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))
                recentTrip?.let { trip->
                    RecentTripCard(
                        startLoc = "Office",
                        destination = "home",
                        distance = trip.distanceKm?.toInt()?:0,
                        drivingTime = trip.durationMinutes?.toInt()?:0,
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