package com.omnitech.drivingtracker.ui.trip

//import androidx.compose.foundation.background
//import androidx.compose.runtime.Composable
//import androidx.compose.ui.tooling.preview.Preview
//import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
//import androidx.compose.foundation.layout.*
//import androidx.compose.foundation.layout.Arrangement
//import androidx.compose.foundation.rememberScrollState
//import androidx.compose.foundation.shape.RoundedCornerShape
//import androidx.compose.foundation.verticalScroll
//import androidx.compose.material3.*
//import androidx.compose.ui.Alignment
//import androidx.compose.ui.Modifier
//import androidx.compose.ui.graphics.Color
//import androidx.compose.ui.unit.dp
//import androidx.compose.ui.text.font.FontWeight
//import androidx.compose.ui.unit.sp
//import com.omnitech.drivingtracker.ui.theme.Green
//import androidx.compose.material.icons.Icons
//import androidx.compose.material.icons.filled.Add
//import androidx.compose.material.icons.filled.Settings
//import androidx.compose.material.icons.filled.Tune
//import com.omnitech.drivingtracker.ui.components.BottomNavBar
//import com.omnitech.drivingtracker.ui.components.ScoreRing
//import androidx.compose.foundation.Image
//import androidx.compose.material.icons.automirrored.filled.ArrowBack
//import androidx.compose.ui.res.painterResource
//import com.omnitech.drivingtracker.R
//import androidx.compose.ui.layout.ContentScale
//import com.omnitech.drivingtracker.data.models.ConsentStatus
//import com.omnitech.drivingtracker.data.models.ContactDto
//import com.omnitech.drivingtracker.data.models.TripItemDto
//import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
//import com.omnitech.drivingtracker.ui.theme.Green
//import java.time.Instant
//import java.time.ZoneId
//import java.time.format.DateTimeFormatter
//import androidx.compose.runtime.Composable
//import androidx.compose.runtime.collectAsState
//import androidx.compose.runtime.getValue
//import androidx.compose.runtime.mutableStateOf
//import androidx.compose.runtime.remember
//import androidx.compose.runtime.setValue
import androidx.compose.foundation.Image
import androidx.compose.material3.IconButton
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckBox
import androidx.compose.material.icons.filled.CheckBoxOutlineBlank
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.omnitech.drivingtracker.Screen
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.omnitech.drivingtracker.R
import com.omnitech.drivingtracker.data.models.ConsentStatus
import com.omnitech.drivingtracker.data.models.ContactDto
import com.omnitech.drivingtracker.data.models.TripItemDto
import com.omnitech.drivingtracker.data.models.VehicleDto
import com.omnitech.drivingtracker.ui.components.BottomNavBar
import com.omnitech.drivingtracker.ui.components.ScoreRing
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import com.omnitech.drivingtracker.ui.theme.Green
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale
import android.Manifest
import android.content.pm.PackageManager
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.platform.LocalContext
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import com.omnitech.drivingtracker.services.TripTrackingService
import com.omnitech.drivingtracker.ui.contacts.ContactsViewModel

@Composable
fun Trips(
    navController: NavController? = null,
    tripsViewModel: TripsViewModel = hiltViewModel(),
    tripViewModel: TripViewModel = hiltViewModel(),
    contactsViewModel: ContactsViewModel = hiltViewModel()
) {
    val tripsState by tripsViewModel.uiState.collectAsState()
    val tripStartState by tripViewModel.tripStartState.collectAsState()
    val vehiclesState by tripViewModel.vehiclesState.collectAsState()
    val approvedContactsState by tripViewModel.approvedContactsState.collectAsState()

    val approvedContacts = when (val state = approvedContactsState) {
        is TripViewModel.UiState.SuccessApprovedContacts -> state.data
        else -> emptyList()
    }

    val vehicles = when (val state = vehiclesState) {
        is TripViewModel.UiState.SuccessVehicles -> state.vehicles
        else -> emptyList()
    }

    val context = LocalContext.current

    LaunchedEffect(tripStartState){
        val state = tripStartState
        if (state is TripViewModel.UiState.Success) {
            val tripId = state.data

            if (tripId.isNotEmpty()){
                TripTrackingService.startTrip(context, tripId)

                navController?.navigate(Screen.LiveTrip.createRoute(tripId))
            }
        }
    }

    TripsContent(
        tripsState = tripsState,
        tripStartState = tripStartState,
        approvedContacts = approvedContacts,
        vehicles = vehicles,
        onRetryTrips = { tripsViewModel.loadTripsHistory() },
        onStartTrip = { vehicleId, dataSource, latitude, longitude, contactIds ->
            tripViewModel.startTrip(
                vehicleId = vehicleId,
                dataSource = dataSource,
                latitude = latitude,
                longitude = longitude,
                selectedContactIds = contactIds.ifEmpty { null }
            )
        },
        onRefreshContacts = {
            tripViewModel.loadVehicles()
            tripViewModel.loadApprovedContacts()
        },
        onApplyFilters = {status, start,end ->
            tripsViewModel.loadTripsHistory(start,end,status)
        },
        navController = navController
    )
}

@Composable
fun TripsContent(
    tripsState: TripsViewModel.UiState,
    tripStartState: TripViewModel.UiState,
    approvedContacts: List<ContactDto>,
    vehicles: List<VehicleDto>,
    onRetryTrips: () -> Unit,
    onStartTrip: (String, String, Double, Double, List<String>) -> Unit,
    onRefreshContacts: () -> Unit,
    onApplyFilters: (String?, String?, String?) -> Unit,
    navController: NavController? = null
) {
    var showStartTripDialog by remember { mutableStateOf(false) }
    var showFilterDialog by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Icon(
                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = "Back",
                tint = MaterialTheme.colorScheme.onBackground
            )
            Row {
                Text(
                    text = "Driving ",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = MaterialTheme.colorScheme.onBackground
                )
                Text(
                    text = "Tracker",
                    fontWeight = FontWeight.Normal,
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

        //Page title
        Text(
            text = "Trips",
            fontWeight = FontWeight.Bold,
            style = MaterialTheme.typography.headlineLarge,
            color = MaterialTheme.colorScheme.onBackground,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
        )

        //Start new trip
        Card(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFFEEEEEE))
        ){
            Column(modifier = Modifier.padding(16.dp)){
                Text("On the move again?", style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(8.dp))
                Button(
                    onClick = {
                        onRefreshContacts()
                        showStartTripDialog = true
                              },
                    colors = ButtonDefaults.buttonColors(containerColor = Green)
                ) {
                    Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Start new trip")
                }
                when (tripStartState) {
                    is TripViewModel.UiState.Loading -> {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Starting trip...",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    is TripViewModel.UiState.Error -> {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = tripStartState.message ?: "Failed to start trip",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.error
                        )
                    }
                    is TripViewModel.UiState.Success -> {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Trip started successfully.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    else -> Unit
                }
            }
        }
        //past trips heading and trips filtering
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Past", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            IconButton(onClick = {showFilterDialog= true}) {
                Icon(Icons.Default.Tune, contentDescription = "Filter", tint = MaterialTheme.colorScheme.onBackground)
            }

        }

        when (tripsState) {
            is TripsViewModel.UiState.Loading, is TripsViewModel.UiState.Idle -> {
                Box(
                    modifier = Modifier.weight(1f).fillMaxWidth(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
            is TripsViewModel.UiState.Error -> {
                Box(
                    modifier = Modifier.weight(1f).fillMaxWidth(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = tripsState.message ?: "Failed to load trips",
                            color = MaterialTheme.colorScheme.error
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Button(onClick = onRetryTrips) {
                            Text("Retry")
                        }
                    }
                }
            }
            is TripsViewModel.UiState.Success -> {
                val trips = tripsState.trips
                if (trips.isEmpty()) {
                    Box(
                        modifier = Modifier.weight(1f).fillMaxWidth(),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "No trips yet",
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                } else {
                    Column(
                        modifier = Modifier.weight(1f)
                            .verticalScroll(rememberScrollState())
                            .padding(horizontal = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        trips.forEachIndexed { index, trip ->
                            TripCard(trip = trip, isLatest = index == 0,onSeeMoreClick = {navController?.navigate(
                                Screen.TripSummary.createRoute(trip.tripId))}
                            )
                        }
                    }
                }
            }
        }
        BottomNavBar(navController = navController, "trip")
    }

    if (showStartTripDialog) {
        StartTripDialog(
            approvedContacts = approvedContacts,
            vehicles = vehicles,
            onDismiss = { showStartTripDialog = false },
            onStartTrip = { vehicleId, dataSource, latitude, longitude, contactIds ->
                onStartTrip(vehicleId, dataSource, latitude, longitude, contactIds)
                showStartTripDialog = false
            }
        )
    }
    if(showFilterDialog){
        FilterDialog(onDismiss = { showFilterDialog = false },
            onApply = {status,start,end ->
                onApplyFilters(status,start,end)
            showFilterDialog= false
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun FilterDialog(
    onDismiss: () -> Unit,
    onApply: (status: String?, startDate: String?, endDate: String?) -> Unit
) {
    var selectedStatus by remember { mutableStateOf<String?>(null) }
    var startDate by remember { mutableStateOf("") }
    var endDate by remember { mutableStateOf("") }
    var expanded by remember { mutableStateOf(false) }

    val statusOptions = listOf("ALL", "COMPLETED", "ONGOING", "CANCELLED")

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Filter Trips") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                // Status Dropdown
                ExposedDropdownMenuBox(
                    expanded = expanded,
                    onExpandedChange = { expanded = !expanded }
                ) {
                    OutlinedTextField(
                        value = selectedStatus ?: "Select Status",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Status") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                        colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors(),
                        modifier = Modifier.menuAnchor().fillMaxWidth()
                    )
                    ExposedDropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false }
                    ) {
                        statusOptions.forEach { option ->
                            DropdownMenuItem(
                                text = { Text(option) },
                                onClick = {
                                    selectedStatus = if (option == "ALL") null else option
                                    expanded = false
                                }
                            )
                        }
                    }
                }

                // Date inputs (Enter as YYYY-MM-DD)
                OutlinedTextField(
                    value = startDate,
                    onValueChange = { startDate = it },
                    label = { Text("Start Date (YYYY-MM-DD)") },
                    placeholder = { Text("e.g. 2023-10-01") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = endDate,
                    onValueChange = { endDate = it },
                    label = { Text("End Date (YYYY-MM-DD)") },
                    placeholder = { Text("e.g. 2023-10-31") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            TextButton(onClick = {
                // Format dates to ISO before sending
                val startIso = if (startDate.isNotBlank()) "${startDate}T00:00:00Z" else null
                val endIso = if (endDate.isNotBlank()) "${endDate}T23:59:59Z" else null
                onApply(selectedStatus, startIso, endIso)
            }) {
                Text("Apply")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
@OptIn(ExperimentalPermissionsApi::class, ExperimentalMaterial3Api::class)
@Composable
private fun StartTripDialog(
    approvedContacts: List<ContactDto>,
    vehicles: List<VehicleDto>,
    onDismiss: () -> Unit,
    onStartTrip: (vehicleId: String, dataSource: String, latitude: Double, longitude: Double, contactIds: List<String>) -> Unit
) {
    var selectedVehicle by remember { mutableStateOf<VehicleDto?>(null) }
    var expanded by remember { mutableStateOf(false) }
    var dataSource by rememberSaveable { mutableStateOf("PHONE") }
    var latitude by rememberSaveable { mutableStateOf("") }
    var longitude by rememberSaveable { mutableStateOf("") }
    var selectedContactIds by remember { mutableStateOf(setOf<String>()) }

    val context = LocalContext.current
    val locationPermissionState = rememberPermissionState(Manifest.permission.ACCESS_FINE_LOCATION)
    val fusedLocationClient = remember { LocationServices.getFusedLocationProviderClient(context) }

    LaunchedEffect(locationPermissionState.status.isGranted){

        if (locationPermissionState.status.isGranted){
            try {
                fusedLocationClient.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, null)
                    .addOnSuccessListener{ location ->
                        if (location != null) {
                            latitude = location.latitude.toString()
                            longitude = location.longitude.toString()
                        }
                    }

            } catch (_: SecurityException) {
                //Permission revoked between check and call
            }
        } else {
            locationPermissionState.launchPermissionRequest()
        }
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Start Trip") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                // Vehicle Selection Dropdown
                ExposedDropdownMenuBox(
                    expanded = expanded,
                    onExpandedChange = { expanded = !expanded },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    OutlinedTextField(
                        value = if (selectedVehicle != null) "${selectedVehicle?.make} ${selectedVehicle?.model}" else "Select Vehicle",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Vehicle") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                        colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors(),
                        modifier = Modifier.menuAnchor().fillMaxWidth()
                    )
                    ExposedDropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false }
                    ) {
                        vehicles.forEach { vehicle ->
                            DropdownMenuItem(
                                text = { Text("${vehicle.make} ${vehicle.model} (${vehicle.registration})") },
                                onClick = {
                                    selectedVehicle = vehicle
                                    expanded = false
                                }
                            )
                        }
                    }
                }

                OutlinedTextField(
                    value = dataSource,
                    onValueChange = { dataSource = it },
                    label = { Text("Data source") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                
                // Location is captured in background, hidden from UI

                Text(
                    text = "Share with approved contacts",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold
                )

                if (approvedContacts.isEmpty()) {
                    Text(
                        text = "No approved contacts available.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                } else {
                    Column(
                        modifier = Modifier.height(180.dp).verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        approvedContacts.forEach { contact ->
                            val checked = selectedContactIds.contains(contact.contactId)
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                OutlinedButton(
                                    onClick = {
                                        selectedContactIds = if (checked) {
                                            selectedContactIds - contact.contactId
                                        } else {
                                            selectedContactIds + contact.contactId
                                        }
                                    },
                                    contentPadding = PaddingValues(4.dp),
                                    modifier = Modifier.size(28.dp),
                                    colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.onBackground)
                                ) {
                                    if (checked) {
                                        Icon(Icons.Filled.CheckBox, contentDescription = null)
                                    } else {
                                        Icon(Icons.Filled.CheckBoxOutlineBlank, contentDescription = null)
                                    }
                                }
                                Spacer(modifier = Modifier.width(8.dp))
                                Column {
                                    Text(
                                        contact.name,
                                        style = MaterialTheme.typography.bodyMedium,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    Text(
                                        contact.username,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = {
                val lat = latitude.toDoubleOrNull()
                val lng = longitude.toDoubleOrNull()
                val vehicleId = selectedVehicle?.vehicleId
                if (vehicleId != null && lat != null && lng != null) {
                    onStartTrip(
                        vehicleId,
                        dataSource.trim(),
                        lat,
                        lng,
                        selectedContactIds.toList()
                    )
                }
            }) {
                Text("Start")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

private fun formatTripDate(value: String?): String {
    return runCatching {
        if (value.isNullOrBlank()) {
            "Unknown"
        } else {
            Instant.parse(value).atZone(ZoneId.systemDefault())
                .format(DateTimeFormatter.ofPattern("dd MMM"))
        }
    }.getOrDefault("Unknown")
}

private fun formatTripTime(value: String?): String {
    return runCatching {
        if (value.isNullOrBlank()) {
            "Unknown"
        } else {
            Instant.parse(value).atZone(ZoneId.systemDefault())
                .format(DateTimeFormatter.ofPattern("HH:mm"))
        }
    }.getOrDefault("Unknown")
}

private fun formatTripDistance(value: Double?): String {
    return value?.let { String.format(Locale.getDefault(), "%.1f", it) + " km" } ?: "-- km"
}

private fun formatTripDuration(value: Int?): String {
    return value?.let { "$it min" } ?: "-- min"
}

private fun formatTripScore(trip: TripItemDto): Int {
    return trip.trip_scores?.firstOrNull()?.overallScore?.toInt()?.coerceIn(0, 100) ?: 0
}


@Composable
fun TripCard(trip: TripItemDto, isLatest: Boolean = false, onSeeMoreClick: () -> Unit) {

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFEEEEEE)),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column {
            if (isLatest) { //expands the details (map) of the latest trip
                /*Box(
                    modifier = Modifier.fillMaxWidth().height(160.dp).background(Color(0xFF9CA3AF))
                )*/
                //This is the map placeholder (bottom=actual map, top = grey map placeholder)
                Image(
                    painter = painterResource(id = R.drawable.map),
                    contentDescription = "Trip map",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxWidth().height(160.dp)
                )
            }
        }

        //Trip details row
        Row(
            modifier = Modifier.fillMaxWidth().padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            //route icon placeholder
            Image(
                painter = painterResource(id = R.drawable.destination),
                contentDescription = "Destination icon",
                modifier = Modifier.size(40.dp)
            )
            Spacer(modifier = Modifier.width(12.dp))

            //Trip details
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    "${formatTripDate(trip.startTime)}, ${formatTripTime(trip.startTime)}",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold
                )
                val vehicle = "VW Polo"
//                Text(trip.from, style = MaterialTheme.typography.bodyMedium)
//                Text(trip.to, style = MaterialTheme.typography.bodyMedium)
                Text(vehicle?: "Vehicle not set", style = MaterialTheme.typography.bodyMedium)
                Text(trip.status, style = MaterialTheme.typography.bodyMedium)
            }

            //distance and duration
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
//                Text(trip.distance, style = MaterialTheme.typography.bodyMedium)
//                Text(trip.duration, style = MaterialTheme.typography.bodyMedium)
                Text(formatTripDistance(trip.distanceKm), style = MaterialTheme.typography.bodyMedium)
                Text(formatTripDuration(trip.durationMinutes), style = MaterialTheme.typography.bodyMedium)
            }

            Spacer(modifier = Modifier.width(12.dp))

            //score and see more

            Column(horizontalAlignment = Alignment.CenterHorizontally) {

                //score ring
                ScoreRing(
                    score = formatTripScore(trip),
                    modifier = Modifier.size(44.dp)
                )
                Spacer(modifier = Modifier.height(4.dp))
                Button(
                    onClick = onSeeMoreClick,
                    shape = RoundedCornerShape(50),
                    colors = ButtonDefaults.buttonColors(containerColor = Green),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                    modifier = Modifier.height(28.dp)
                ) {
                    Text(
                        "See More",
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.White
                    )
                }
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun TripsPreview() {
    val mockTrips = listOf(
        TripItemDto(
            tripId = "1",
            userId = "user1",
            vehicleId = "VW Golf 7",
            startTime = "2023-10-27T17:00:00Z",
            endTime = "2023-10-27T17:45:00Z",
            distanceKm = 40.0,
            durationMinutes = 45,
            fuelEstimate = null,
            dataSource = "PHONE",
            status = "COMPLETED",
            createdAt = "2023-10-27T17:00:00Z",
            trip_scores = emptyList()
        ),
        TripItemDto(
            tripId = "2",
            userId = "user1",
            vehicleId = "VW Golf 7",
            startTime = "2023-10-27T08:15:00Z",
            endTime = "2023-10-27T09:05:00Z",
            distanceKm = 40.0,
            durationMinutes = 50,
            fuelEstimate = null,
            dataSource = "PHONE",
            status = "COMPLETED",
            createdAt = "2023-10-27T08:15:00Z",
            trip_scores = emptyList()
        )
    )

    DrivingTrackerTheme {
        TripsContent(
            tripsState = TripsViewModel.UiState.Success(mockTrips),
            tripStartState = TripViewModel.UiState.Idle,
            approvedContacts = emptyList(),
            vehicles = emptyList(),
            onRetryTrips = {},
            onStartTrip = { _, _, _, _, _ -> },
            onRefreshContacts = {},
            onApplyFilters = { _, _, _ -> }
        )
    }
}
