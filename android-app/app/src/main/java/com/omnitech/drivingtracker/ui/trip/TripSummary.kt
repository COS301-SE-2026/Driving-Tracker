package com.omnitech.drivingtracker.ui.trip
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.navigation.NavController
import com.omnitech.drivingtracker.ui.components.BottomNavBar
import com.omnitech.drivingtracker.ui.components.ScoreRingTwo
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import java.util.Locale
import com.omnitech.drivingtracker.ui.components.StandardScreen

data class TripSummaryData(
    val date: String = "25 April 2026, 12:45",
    val route: String = "Home → Office",
    val score: Int = 80,
    val rating: String = "Good",
    val distance: String = "18.6 km",
    val duration: String = "00:32:18",
    val avgSpeed: String = "62 km/h",
    val maxSpeed: String = "15.1 km/l",
    val fuelEfficiency: String = "15.1 km/l",
    val hardBreaking: Int = 2,
    val hardAcceleration: Int = 2,
    val overspeeding: Int = 2,
    val cornering: Int = 2,
    val phoneUsage: Int = 3
)

@Composable
fun TripSummary(
    tripId: String,
    navController: NavController? = null,
    viewModel: TripSummaryViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(tripId) {
        if (tripId.isNotEmpty()) {
            viewModel.loadTripSummary(tripId)
        }
    }

    when (val state = uiState) {
        is TripSummaryViewModel.UiState.Loading -> {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        }
        is TripSummaryViewModel.UiState.Error -> {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text(text = state.message ?: "Error loading trip", color = MaterialTheme.colorScheme.error)
            }
        }
        is TripSummaryViewModel.UiState.Success -> {
            val trip = state.trip
            val mappedData = TripSummaryData(
                date = trip.startedAt,
                route = "Trip to ${trip.vehicleId ?: "Destination"}",
                score = trip.scores?.overallScore?.toInt() ?: 0,
                rating = when {
                    (trip.scores?.overallScore ?: 0.0) >= 80 -> "Great"
                    (trip.scores?.overallScore ?: 0.0) >= 60 -> "Good"
                    else -> "Fair"
                },
                distance = "${String.format(Locale.getDefault(), "%.1f", trip.distanceKm ?: 0.0)} km",
                duration = "${trip.durationMinutes ?: 0} min",
                avgSpeed = "-- km/h", // API doesn't provide avg speed yet
                maxSpeed = "-- km/h",
                fuelEfficiency = "${String.format(Locale.getDefault(), "%.1f", trip.fuelEstimate ?: 0.0)} km/l",
                hardBreaking = trip.events.count { it.eventType == "HARSH_BRAKE" },
                hardAcceleration = trip.events.count { it.eventType == "HARSH_ACCELERATION" },
                overspeeding = trip.events.count { it.eventType == "OVERSPEEDING" },
                cornering = trip.events.count { it.eventType == "HARSH_CORNERING" },
                phoneUsage = trip.events.count { it.eventType == "PHONE_USAGE" }
            )
            TripSummaryContent(trip = mappedData, navController = navController)
        }
        else -> Unit
    }
}

@Composable
fun TripSummaryContent(
    trip: TripSummaryData,
    navController: NavController? = null
) {

    StandardScreen(
        navController = navController,
        title = "Trip Summary",
        bottomBarColor = "trip"
    ){
        //Trip time and location
        Card(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.Transparent),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(trip.date, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(8.dp))
                Text(trip.route, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        //Trip Score
        Card(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.Transparent),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
        ) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                ScoreRingTwo(
                    score = trip.score,
                    modifier = Modifier.size(140.dp),
                    rating = trip.rating
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        //Trip Details
        Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFEEEEEE))) {
            Column(
                modifier = Modifier.padding(20.dp)
            ) {
                Text("Trip details", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyMedium)

                Spacer(modifier = Modifier.height(8.dp))

                TripDetailRow("Distance", trip.distance)
                TripDetailRow("Duration", trip.duration)
                TripDetailRow("Average Speed", trip.avgSpeed)
                TripDetailRow("Max Speed", trip.maxSpeed)
                TripDetailRow("Fuel Efficiency", trip.fuelEfficiency)
            }
        }
        Spacer(modifier = Modifier.height(12.dp))

        //Trip Events
        Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFEEEEEE))) {
            Column(
                modifier = Modifier.padding(20.dp)
            ) {
                Text("Trip Events", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyMedium)

                Spacer(modifier = Modifier.height(8.dp))

                TripDetailRow("Hard Braking", trip.hardBreaking.toString())
                TripDetailRow("Hard Acceleration", trip.hardAcceleration.toString())
                TripDetailRow("Overspeeding", trip.overspeeding.toString())
                TripDetailRow("Cornering", trip.cornering.toString())
                TripDetailRow("Phone Usage", trip.phoneUsage.toString())
            }
        }

        Spacer(modifier = Modifier.height(12.dp))
    }
}

@Composable
fun TripDetailRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, style = MaterialTheme.typography.bodyMedium)
        Text(value, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
    }
}

@Preview(showBackground = true)
@Composable
fun TripSummaryPreview() {
    DrivingTrackerTheme {
        TripSummaryContent(trip = TripSummaryData())
    }
}
