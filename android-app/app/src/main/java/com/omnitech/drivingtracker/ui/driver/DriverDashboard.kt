package com.omnitech.drivingtracker.ui.driver

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.omnitech.drivingtracker.Screen
import com.omnitech.drivingtracker.ui.components.DriverBottomNavBar
import com.omnitech.drivingtracker.ui.components.RecentTripCard
import com.omnitech.drivingtracker.ui.components.ScoreCard
import com.omnitech.drivingtracker.ui.components.TopBar
import com.omnitech.drivingtracker.ui.home.DashboardViewModel
import com.omnitech.drivingtracker.ui.theme.*

@Composable
fun DriverDashboard(
    navController: NavController? = null,
    dashboardViewModel: DashboardViewModel = hiltViewModel()
) {
    val uiState by dashboardViewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopBar(
                leftIcon = Icons.Default.Notifications,
                rightIcon = Icons.Default.Settings,
                onLeftClick = { navController?.navigate(Screen.Notifications.route) },
                onRightClick = { navController?.navigate(Screen.Settings.route) }
            )
        },
        bottomBar = { DriverBottomNavBar(navController = navController, color = "home") }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            //Fleet driver role badge
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Blue.copy(alpha = 0.1f)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.DirectionsCar, contentDescription = null, tint = Blue)
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text("Fleet Driver Mode", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = Blue)
                        Text("Assigned by Fleet Manager", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                    }
                }
            }

            //Quick start scheduled trip card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Green.copy(alpha = 0.15f)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Assigned Scheduled Trip", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold, color = Green)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("View your manager-scheduled trips and launch trip tracking.", style = MaterialTheme.typography.bodySmall, color = Color.DarkGray)
                    Spacer(modifier = Modifier.height(12.dp))
                    Button(
                        onClick = { navController?.navigate(Screen.DriverTrips.route) },
                        colors = ButtonDefaults.buttonColors(containerColor = Green)
                    ) {
                        Icon(Icons.Default.PlayArrow, contentDescription = null)
                        Spacer(modifier = Modifier.height(6.dp))
                        Text("Open Scheduled Trips")
                    }
                }
            }

            //Driver driving score
            ScoreCard(score = uiState.overallScore, heading = "Overall Driver Score")

            //Recent completed trips
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Recent Trips", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Text("View all", style = MaterialTheme.typography.bodyMedium, color = Blue, modifier = Modifier.clickable { navController?.navigate(Screen.DriverTrips.route) })
            }

            uiState.recentTrip?.let { trip ->
                RecentTripCard(
                    trip,
                    onClick = { navController?.navigate(Screen.TripSummary.createRoute(trip.tripId)) }
                )
            } ?: Text("No recent trips found", style = MaterialTheme.typography.bodyMedium)
        }
    }
}