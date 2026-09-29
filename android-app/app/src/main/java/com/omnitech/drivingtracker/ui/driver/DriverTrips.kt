package com.omnitech.drivingtracker.ui.driver

import android.Manifest
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.navigation.NavController
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.omnitech.drivingtracker.Screen
import com.omnitech.drivingtracker.data.models.ScheduledTripDto
import com.omnitech.drivingtracker.services.TripTrackingService
import com.omnitech.drivingtracker.ui.components.DriverBottomNavBar
import com.omnitech.drivingtracker.ui.components.StandardScreen
import com.omnitech.drivingtracker.ui.theme.Blue
import com.omnitech.drivingtracker.ui.theme.Green
import com.omnitech.drivingtracker.ui.trip.TripViewModel

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun DriverTrips(
    navController: NavController? = null,
    tripViewModel: TripViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val scheduledTripsState by tripViewModel.scheduledTripsState.collectAsState()
    val tripStartState by tripViewModel.tripStartState.collectAsState()

    val locationPermissionsState = rememberPermissionState(Manifest.permission.ACCESS_FINE_LOCATION)
    val fusedLocationClient = remember { LocationServices.getFusedLocationProviderClient(context) }

    var currentLat by remember { mutableDoubleStateOf(0.0) }
    var currentLng by remember { mutableDoubleStateOf(0.0) }

    LaunchedEffect(Unit) {
        tripViewModel.loadScheduledTrips()
    }

    LaunchedEffect(locationPermissionsState.status.isGranted) {
        if (locationPermissionsState.status.isGranted) {
            try {
                fusedLocationClient.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, null)
                    .addOnSuccessListener { loc ->
                        if (loc != null) {
                            currentLat = loc.latitude
                            currentLng = loc.longitude
                        }
                    }
            } catch (_: SecurityException) {}
        } else {
            locationPermissionsState.launchPermissionRequest()
        }
    }

    LaunchedEffect(tripStartState) {
        if (tripStartState is TripViewModel.UiState.Success) {
            val tripId = (tripStartState as TripViewModel.UiState.Success).data
            if (tripId.isNotEmpty()) {
                TripTrackingService.startTrip(context, tripId)
                navController?.navigate(Screen.LiveTrip.createRoute(tripId))
            }
        }
    }

    StandardScreen(
        navController = navController,
        title = "Scheduled Trips",
        bottomBarColor = "trip"
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text("Assigned Trips", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)

            when (val state = scheduledTripsState) {
                is TripViewModel.UiState.Loading -> {
                    Box(modifier = Modifier.fillMaxWidth().height(150.dp), contentAlignment = Alignment.Center){
                        CircularProgressIndicator()
                    }
                }
                is TripViewModel.UiState.Error -> {
                    Text(text = state.message ?: "Failed to load scheduled trips", color = MaterialTheme.colorScheme.error)
                    Button(onClick = { tripViewModel.loadScheduledTrips() }) { Text("Retry")}
                }
                is TripViewModel.SuccessScheduledTrips -> {
                    if (state.scheduledTrips.isEmpty()) {
                        Text("No trips assigned by manager.", color = Color.Gray)
                    } else {
                        state.scheduledTrips.forEach { trip ->
                            ScheduledTripCard(
                                trip = trip,
                                onStartTrip = {
                                    tripViewModel.startScheduledTrip(
                                        scheduledTripId = trip.getEffectiveId(),
                                        vehicleId = trip.vehicleId ?: "",
                                        latitude = currentLat,
                                        longitude = currentLng,
                                        destLat = trip.getEffectiveDestLat(),
                                        destLng = trip.getEffectiveDestLng()
                                    )
                                }
                            )
                        }
                    }
                }
                else -> Unit
            }
        }
    }
}

@Composable
fun ScheduledTripCard(
    trip: ScheduledTripDto,
    onStartTrip: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFEEEEEE)),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.LocationOn, contentDescription = null, tint = Blue)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "${trip.getEffectiveOrigin()} -> ${trip.getEffectiveDestination()}",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            val vehicleText = listOfNotNull(
                trip.vehicleName.takeIf { !it.isNullOrEmpty() },
                trip.getEffectiveVehicleRegistration().takeIf { it.isNotEmpty() }
            ).joinToString(" - ")

            if (vehicleText.isNotEmpty()) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.DirectionsCar, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "Assigned Vehicle: $vehicleText",
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }

            if (trip.getEffectiveStartTime().isNotEmpty()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = "Scheduled: ${trip.getEffectiveStartTime()}", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
            }

            if (trip.getEffectiveNotes().isNotEmpty()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = "Notes: ${trip.getEffectiveNotes()}", style = MaterialTheme.typography.bodySmall, color = Color.DarkGray)
            }

            Spacer(modifier = Modifier.height(12.dp))

            Button(
                onClick = onStartTrip,
                colors = ButtonDefaults.buttonColors(containerColor = Green),
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(Icons.Default.PlayArrow, contentDescription = null)
                Spacer(modifier = Modifier.width(6.dp))
                Text("Start Assigned Trip")
            }
        }
    }
}

