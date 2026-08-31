package com.omnitech.drivingtracker.ui.trip
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.EditNote
import androidx.compose.material.icons.filled.Event
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.navigation.NavController
//import androidx.paging.
import com.omnitech.drivingtracker.R
import com.omnitech.drivingtracker.ui.components.AzureMapContainer
import com.omnitech.drivingtracker.ui.components.BottomNavBar
import com.omnitech.drivingtracker.ui.components.ScoreRingTwo
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import java.util.Locale
import com.omnitech.drivingtracker.ui.components.StandardScreen
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.time.ZoneId
import com.omnitech.drivingtracker.data.models.LocationDto

data class TripSummaryData(
    val date: String = "25 April 2026 • 12:45",
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

    val mapToken by viewModel.mapTokenState.collectAsState()
    val tripPath by viewModel.tripPath.collectAsState()

    LaunchedEffect(tripId) {
        if (tripId.isNotEmpty()) {
            viewModel.loadTripSummary(tripId)
            viewModel.loadTripPath(tripId)
            viewModel.fetchMapToken()
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
            val formattedDate = try{
                val zdt = ZonedDateTime.parse(trip.startedAt).withZoneSameInstant(ZoneId.systemDefault())
                val formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy • HH:mm")
                zdt.format(formatter)
            }catch(e: Exception){
                trip.startedAt
            }
            val dbPath = trip.routePolyline?.coordinates?.map {
                LocationDto(it[1], it[0]) // GeoJSON is [lng, lat], convert to [lat, lng]
            } ?: emptyList()

            val displayPath = if (tripPath.isEmpty()) dbPath else tripPath

            val mappedData = TripSummaryData(
                date = formattedDate,
                route = "Trip ${trip.tripId}",
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
            TripSummaryContent(trip = mappedData,
                navController = navController,
                mapToken = mapToken,
                tripPath = displayPath
            )
        }
        else -> Unit
    }
}

@Composable
fun TripSummaryContent(
    trip: TripSummaryData,
    navController: NavController? = null,
    mapToken: String? = null,
    tripPath: List<LocationDto> = emptyList()
) {
    val hasValidPath = tripPath.isNotEmpty()
    val canShowMap = mapToken != null && hasValidPath
    StandardScreen(
        navController = navController,
        title = "Trip Summary",
        bottomBarColor = "trip"
    ){
        Column(modifier = Modifier.padding(20.dp)) {
            Text(trip.date, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))
            Text(trip.route, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        }

        // BIG STATIC MAP: Placed full-width under the labels
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp) // Bigger size
                .padding(horizontal = 16.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(Color(0xFFD0D8E0))
        ) {
            if (canShowMap) {
                AzureMapContainer(
                    subscriptionKey = mapToken!!,
                    actualRoute = tripPath,
                    isInteractive = false, // DISABLES SCROLL  here,
                    zoom = 13,
                    modifier = Modifier.fillMaxSize()
                )
            } else {
                // Fallback UI (Placeholder + Spinner)
                Image(
                    painter = painterResource(id = R.drawable.map),
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize().alpha(0.6f)
                )
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center).size(24.dp)
                )
            }
        }
        //Trip time and location
//        Card(
//            modifier = Modifier
//                .fillMaxWidth()
//                .padding(horizontal = 16.dp),
//            colors = CardDefaults.cardColors(containerColor = Color.Transparent),
//            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
//        ) {
//            Column(modifier = Modifier.padding(20.dp)) {
//                Text(trip.date, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
//                Spacer(modifier = Modifier.height(8.dp))
//                Text(trip.route, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
//            }
//        }

        Spacer(modifier = Modifier.height(12.dp))

        //Trip Score
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 10.dp),
            colors = CardDefaults.cardColors(containerColor = Color.Transparent),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
        ) {
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                ScoreRingTwo(
                    score = trip.score,
                    modifier = Modifier.size(120.dp), // Normal larger size
                    rating = trip.rating
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        //Trip Details
        Card(modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
            shape = RoundedCornerShape(16.dp),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ){
                Column(
                    modifier = Modifier.padding(20.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically){
                        Icon(Icons.Default.EditNote, contentDescription = null, tint = MaterialTheme.colorScheme.tertiary)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            "Trip details",
                            fontWeight = FontWeight.Bold,
                            style = MaterialTheme.typography.titleSmall
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    TripDetailRow("Distance", trip.distance)
                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant, thickness = 0.5.dp)
                    TripDetailRow("Duration", trip.duration)
                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant, thickness = 0.5.dp)
                    TripDetailRow("Fuel Efficiency", trip.fuelEfficiency)
                }
        }
        Spacer(modifier = Modifier.height(12.dp))

        //Trip Events
        Card(modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
            shape = RoundedCornerShape(16.dp),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)) {
            Column(
                modifier = Modifier.padding(20.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically){
                    Icon(Icons.Default.Event, contentDescription = null, tint = MaterialTheme.colorScheme.tertiary)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        "Trip Events",
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.titleSmall
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                TripDetailRow("Hard Braking", trip.hardBreaking.toString())
                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant, thickness = 0.5.dp)
                TripDetailRow("Hard Acceleration", trip.hardAcceleration.toString())
            }
        }

        Spacer(modifier = Modifier.height(12.dp))
    }
}

@Composable
fun TripDetailRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp),
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
