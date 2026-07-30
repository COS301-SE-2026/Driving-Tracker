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
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.navigation.NavController
import com.omnitech.drivingtracker.R
import com.omnitech.drivingtracker.Screen
import com.omnitech.drivingtracker.data.db.entities.TripEventEntity
import com.omnitech.drivingtracker.data.models.LocationDto
import com.omnitech.drivingtracker.data.models.ConsentStatus
import com.omnitech.drivingtracker.data.models.LiveSensorMetrics
import com.omnitech.drivingtracker.data.models.TripSummaryDto
import com.omnitech.drivingtracker.services.TripTrackingService
import com.omnitech.drivingtracker.ui.components.AzureMapContainer
import com.omnitech.drivingtracker.ui.components.BottomNavBar
import com.omnitech.drivingtracker.ui.components.MinimizedTrip
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import java.util.Locale
import com.omnitech.drivingtracker.ui.components.ShareTripDialog
import com.omnitech.drivingtracker.ui.contacts.*
import com.omnitech.drivingtracker.ui.obd.ObdViewModel
import com.omnitech.drivingtracker.data.obd.VehicleMetrics
import java.time.Duration
import java.time.Instant
import kotlinx.coroutines.delay
import androidx.lifecycle.viewmodel.compose.viewModel

@OptIn(com.google.accompanist.permissions.ExperimentalPermissionsApi::class)
@Composable
fun LiveTrip(
    tripId: String,
    viewModel: TripSummaryViewModel = hiltViewModel(),
    contactsViewModel: ContactsViewModel = hiltViewModel(), //needed for share trip
    vehicleViewModel: ObdViewModel = hiltViewModel(),
    navController: NavController? = null
) {
    val metrics by vehicleViewModel.vehicleMetrics.collectAsState() //for speed
    val uiState by viewModel.uiState.collectAsState()
    val endTripState by viewModel.endTripState.collectAsState()
    val mapToken by viewModel.mapTokenState.collectAsState()
    val contactsState by contactsViewModel.uiState.collectAsState()
    val liveMetrics by viewModel.liveMetrics.collectAsState()

    val plannedRoute by viewModel.plannedRoute.collectAsState()
    var destinationLoc by remember { mutableStateOf<com.omnitech.drivingtracker.data.models.LocationDto?>(null) }

    val locationPermissionState = com.google.accompanist.permissions.rememberMultiplePermissionsState(
        listOf(
            android.Manifest.permission.ACCESS_FINE_LOCATION,
            android.Manifest.permission.ACCESS_COARSE_LOCATION
        )
    )

    LaunchedEffect(Unit) {
        if (!locationPermissionState.allPermissionsGranted) {
            locationPermissionState.launchMultiplePermissionRequest()
        }
    }

    val context = LocalContext.current
    val tripPath by viewModel.tripPath.collectAsState()

    val liveDistance = remember(tripPath){
        var total = 0.0
        for(i in 0 until tripPath.size-1){
            val start = tripPath[i]
            val end = tripPath[i + 1]
            if (start.lat != null && start.lng != null && end.lat != null && end.lng != null) {
                val results = FloatArray(1)
                android.location.Location.distanceBetween(start.lat, start.lng, end.lat, end.lng, results)
                total += results[0]
            }
        }
        total/ 1000.0
    }
    var liveDurationMinutes by remember { mutableStateOf(0) }
    val currentTrip = (uiState as? TripSummaryViewModel.UiState.Success)?.trip

    LaunchedEffect(currentTrip?.startedAt) {
        val startIso = currentTrip?.startedAt ?: return@LaunchedEffect
        while(true) {
            try {
                val startTime = java.time.Instant.parse(startIso)
                liveDurationMinutes = java.time.Duration.between(startTime, java.time.Instant.now()).toMinutes().toInt()
            } catch (e: Exception) { }
            kotlinx.coroutines.delay(30000) // Update every 30 seconds
        }
    }
    //val fusedLocationClient = remember { com.google.android.gms.location.LocationServices.getFusedLocationProviderClient(context) }
    //var liveLocation by remember { mutableStateOf<android.location.Location?>(null) }

//    LaunchedEffect(locationPermissionState.allPermissionsGranted) {
//        if (locationPermissionState.allPermissionsGranted) {
//            val locationRequest = com.google.android.gms.location.LocationRequest.Builder(
//                com.google.android.gms.location.Priority.PRIORITY_HIGH_ACCURACY, 5000
//            ).build()
//
//            val callback = object : com.google.android.gms.location.LocationCallback() {
//                override fun onLocationResult(result: com.google.android.gms.location.LocationResult) {
//                    liveLocation = result.lastLocation
//                }
//            }
//
//            try {
//                fusedLocationClient.requestLocationUpdates(locationRequest, callback, android.os.Looper.getMainLooper())
//            } catch (e: SecurityException) {
//                android.util.Log.e("LiveTrip", "Location permission missing: ${e.message}")
//            }
//        }
//    }

//    LaunchedEffect(liveLocation, uiState) {
//        val currentTrip = (uiState as? TripSummaryViewModel.UiState.Success)?.trip
//        val lat = liveLocation?.latitude ?: currentTrip?.events?.lastOrNull()?.latitude ?: -25.7479
//        val lng = liveLocation?.longitude ?: currentTrip?.events?.lastOrNull()?.longitude ?: 28.2293
//        android.util.Log.d("LiveTrip", "Location Update -> Lat: $lat, Lng: $lng (Source: ${if (liveLocation != null) "GPS" else "Event/Fallback"})")
//    }
    LaunchedEffect(uiState, mapToken, liveMetrics) {
        val state = uiState
        if (state is TripSummaryViewModel.UiState.Success && mapToken != null && plannedRoute == null) {
            val trip = state.trip


            if (trip.destinationLatitude != null && trip.destinationLongitude != null) {


                //  remove the hardcoded Pretoria fallback here to avoid the route jumping
//                val startLat = liveLocation?.latitude ?: trip.events.firstOrNull()?.latitude
//                val startLng = liveLocation?.longitude ?: trip.events.firstOrNull()?.longitude
                val startLat = liveMetrics.latitude
                val startLng = liveMetrics.longitude

                //  have valid coordinates
                if (startLat != null && startLng != null) {
                    destinationLoc = LocationDto(trip.destinationLatitude, trip.destinationLongitude)

                    android.util.Log.d("LiveTrip", "Fetching route from real location: $startLat, $startLng")

                    viewModel.suggestedRoute(
                        startLat,
                        startLng,
                        trip.destinationLatitude,
                        trip.destinationLongitude
                    )
                }
            }
        }
    }

    LaunchedEffect(tripId) {
        if (tripId.isNotEmpty()) {
            viewModel.loadTripSummary(tripId)
            viewModel.loadTripPath(tripId)
            viewModel.fetchMapToken()
            viewModel.observeTripEvents(tripId)
        }
    }

    var isMinimized by remember {mutableStateOf(false)}

    val currentEndTripState = endTripState
    
    if (currentEndTripState is TripSummaryViewModel.UiState.Success) {
        if (currentEndTripState.isFirstTrip) {
            AlertDialog(
                onDismissRequest = { },
                title = { Text("Badge Awarded!", fontWeight = FontWeight.Bold) },
                text = {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                        Text("Congratulations! You've earned the \"First Trip\" badge.", textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("You completed your very first drive with Driving Tracker!", style = MaterialTheme.typography.bodySmall)
                    }
                },
                confirmButton = {
                    Button(onClick = {
                        navController?.navigate(Screen.Trips.route) {
                            popUpTo(Screen.Dashboard.route)
                        }
                    }) {
                        Text("Awesome!")
                    }
                }
            )
        } else {
            // If not first trip, navigate away immediately
            LaunchedEffect(Unit) {
                TripTrackingService.stopTrip(context)
                navController?.navigate(Screen.Trips.route) {
                    popUpTo(Screen.Dashboard.route)
                }
            }
        }
    } else if (currentEndTripState is TripSummaryViewModel.UiState.Error) {
        AlertDialog(
            onDismissRequest = { },
            title = { Text("Error") },
            text = { Text(currentEndTripState.message ?: "Failed to end trip") },
            confirmButton = {
                Button(onClick = {
                    navController?.navigate(Screen.Trips.route) {
                        popUpTo(Screen.Dashboard.route)
                    }
                }) {
                    Text("OK")
                }
            }
        )
    }

    val localEvents by viewModel.localEvents.collectAsState()

    LiveTripContent(
        uiState = uiState,
        endTripState = currentEndTripState,
        mapToken = mapToken,
        liveDistance = liveDistance,
        liveDuration = liveDurationMinutes ,
        liveLocation = liveMetrics,
        actualRoute = tripPath,
        contactsState = contactsState,
        localEvents = localEvents,
        onEndTrip = {
            // Get the live trip data from the current state
            val currentTrip = (uiState as? TripSummaryViewModel.UiState.Success)?.trip
            val durationMin = currentTrip?.startedAt?.let { startIso ->
                try {
                    val startTime = java.time.Instant.parse(startIso)
                    val now = java.time.Instant.now()
                    java.time.Duration.between(startTime, now).toMinutes().toInt()
                } catch (e: Exception) { 0 }
            } ?: 0
            // Pass the actual totals to the ViewModel
            viewModel.endTrip(
                tripId = tripId,
                latitude = liveMetrics.latitude,
                longitude = liveMetrics.longitude,
                distance = liveDistance,
                durationMinutes = liveDurationMinutes,
                fuelEstimate = currentTrip?.fuelEstimate?:0.0
            )
        },
        navController = navController,
        destination = destinationLoc,
        plannedRoute = plannedRoute,
        onShareTrip = { contactIds -> contactsViewModel.shareLocation(tripId, contactIds) },
        isMinimized = isMinimized,
        onMinimizeClick = {navController?.navigate(Screen.Dashboard.route){
            popUpTo(Screen.Dashboard.route){inclusive = true}
        } },
        vehicleMetrics = metrics
    )
}

@Composable
fun LiveTripContent(
    uiState: TripSummaryViewModel.UiState,
    endTripState: TripSummaryViewModel.UiState = TripSummaryViewModel.UiState.Idle,
    mapToken: String? = null,
    liveLocation: LiveSensorMetrics? = null,
    contactsState: ContactsViewModel.UiState = ContactsViewModel.UiState.Idle,
    onEndTrip: () -> Unit = {},
    navController: NavController? = null,
    destination: LocationDto? = null,
    actualRoute: List<LocationDto>? = null,
    plannedRoute: List<LocationDto>? = null,
    onShareTrip: (List<String>) -> Unit = {},
    isMinimized: Boolean = false,
    onMinimizeClick: () -> Unit = {},
    localEvents: List<TripEventEntity> = emptyList(),
    vehicleMetrics: VehicleMetrics = VehicleMetrics(),
    liveDistance: Double =0.0,
    liveDuration: Int= 0
) {
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
            Icon(
                imageVector = Icons.Default.ArrowDownward,
                contentDescription = "Make smaller",
                tint = MaterialTheme.colorScheme.onBackground,
                modifier = Modifier.clickable(onClick = onMinimizeClick)
            )
            Row {
                Text(
                    text = "Live",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = " Trip ",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = MaterialTheme.colorScheme.onBackground
                )
            }
            IconButton(onClick = {navController?.navigate(Screen.Settings.route)}) {
                Icon(
                    imageVector = Icons.Default.Settings,
                    contentDescription = "Settings",
                    tint = MaterialTheme.colorScheme.onBackground
                )
            }
        }

        val currentUiState = uiState
        when (currentUiState){
            is TripSummaryViewModel.UiState.Loading ->{
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }

            is TripSummaryViewModel.UiState.Error ->{
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(text = currentUiState.message ?: "Failed to load trip", color = MaterialTheme.colorScheme.error)
                }
            }
            is TripSummaryViewModel.UiState.Success -> {

                AnimatedContent(
                    targetState = isMinimized,
                    transitionSpec = {
                        (slideInVertically { height -> height } + fadeIn())
                            .togetherWith(slideOutVertically { height->height } + fadeOut())
                    },
                    label = "Trip Transition"
                ) {
                    isMinimized ->
                    if (isMinimized){
                        MinimizedTrip(
                            distance = currentUiState.trip.distanceKm ?: 0.0,
                            arrivalTime = "20:00", //Connect to backend/maps
                            onExpandClick = onMinimizeClick
                        )
                    }
                    else{
                        TripDetails(
                            trip = currentUiState.trip,
                            endTripState = endTripState,
                            mapToken = mapToken,
                            liveLocation = liveLocation,
                            onEndTrip = onEndTrip,
                            navController = navController,
                            contactsState = contactsState,
                            onShareTrip = onShareTrip,
                            destination = destination,
                            plannedRoute = plannedRoute,
                            actualRoute = actualRoute,
                            liveDistance = liveDistance,
                            liveDuration = liveDuration,
                            localEvents = localEvents,
                            vehicleMetrics = vehicleMetrics
                        )
                    }

                }
            }
            else -> {}
        }
    }
}

@Composable
private fun TripDetails(
    trip: TripSummaryDto,
    endTripState: TripSummaryViewModel.UiState,
    mapToken: String?,
    liveLocation: LiveSensorMetrics? = null,
    contactsState: ContactsViewModel.UiState,
    onEndTrip: () -> Unit,
    navController: NavController?,
    destination: LocationDto? = null,
    actualRoute: List<LocationDto>?=null,
    plannedRoute: List<LocationDto>? = null,
    onShareTrip: (List<String>) -> Unit,
    liveDistance: Double = 0.0,
    liveDuration: Int = 0,
    localEvents: List<TripEventEntity>,
    vehicleMetrics: VehicleMetrics
) {
    var recenterCount by remember { mutableStateOf(0) }
    var showShareDialog by remember {mutableStateOf(false)}
    var selectedContactIds by remember { mutableStateOf(setOf<String>()) }

    val currentLat = if( liveLocation != null && liveLocation.latitude != 0.0){
        liveLocation.latitude
    }else {
        trip.events.firstOrNull()?.latitude
    }

    val currentLng = if( liveLocation != null && liveLocation.longitude != 0.0){
        liveLocation.longitude
    }else {
        trip.events.firstOrNull()?.longitude
    }

    val hasValidLocation = currentLat!= null && currentLng != null  && currentLat != 0.0

    Column(modifier = Modifier.fillMaxSize()) {
        // Map
        Box(modifier = Modifier
            .fillMaxWidth()
            .height(370.dp)
            .background(Color(0xFFD0D8E0))) {
            if (mapToken != null && hasValidLocation) {
                val latestEvent = trip.events.lastOrNull()
                AzureMapContainer(
                    subscriptionKey = mapToken,
                    latitude = currentLat,
                    longitude = currentLng,
                    actualRoute = actualRoute,
                    destination = destination,
                    plannedRoute = plannedRoute,
                    recenterTrigger = recenterCount,
                    modifier = Modifier.fillMaxSize()
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
            } else {
                // Map placeholder
                Image(
                    painter = painterResource(id = R.drawable.map),
                    contentDescription = "Trip map",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Color.White)
                }
            }
            // Recording badge
            Card(
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(8.dp),
                shape = RoundedCornerShape(50),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(4.dp)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(modifier = Modifier
                        .size(8.dp)
                        .background(Color.Red, CircleShape))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Recording", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = Color.Black)
                }
            }

            //Timer
            Card(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(8.dp),
                shape = RoundedCornerShape(50),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(4.dp)
            ) {
                TripTimer(startedAt = trip.startedAt)
            }

            //Speed and fuel for trips
            Column(
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(8.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp),
                horizontalAlignment = Alignment.End
            ) {
                Card(shape = RoundedCornerShape(8.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(4.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Default.Speed,
                            contentDescription = null,
                            modifier = Modifier.size(20.dp),
                            tint = Color.Black
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Column {
                            Text(
                                "${vehicleMetrics.speed} km/h",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Bold, color = Color.Black
                            )
                            Text("Speed", style = MaterialTheme.typography.labelSmall, color = Color.Black)
                        }
                    }
                }
                Card(shape = RoundedCornerShape(8.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(4.dp)) {
                    Row(
                        modifier = Modifier.padding(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("♻️", fontSize = 16.sp)
                        Spacer(modifier = Modifier.width(4.dp))
                        Column {
                            Text(
                                "${String.format(Locale.getDefault(), "%.1f", trip.fuelEstimate ?: 0.0)} L",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Bold, color = Color.Black
                            )
                            Text("Fuel Efficiency", style = MaterialTheme.typography.labelSmall, color = Color.Black)
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Button(
                onClick = onEndTrip,
                enabled = endTripState !is TripSummaryViewModel.UiState.Loading,
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                if (endTripState is TripSummaryViewModel.UiState.Loading) {
                    CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                } else {
                    Text("End Trip", color = Color.White)
                }
            }
            Button(
                onClick = {showShareDialog = true},
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
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

        TripSummaryCard(
            distanceKm = liveDistance,
            durationMinutes = liveDuration,
            fuelEstimate = trip.fuelEstimate,
            avgSpeed = vehicleMetrics.speed.toString(),
            isLive = true
        )

        Spacer(modifier = Modifier.height(12.dp))

        //Alerts section (alerts not made but count used)

        TripAlertsCard(
            hardBrakingCount = localEvents.count {it.type == "HARSH_BRAKE"},
            hardAccelerationCount = localEvents.count {it.type == "HARSH_ACCELERATION"},
        )

        Spacer(modifier = Modifier.weight(1f))

    }
    if (showShareDialog){
        when (contactsState){

            is ContactsViewModel.UiState.Success -> {

                ShareTripDialog(
                    //only users who have consented to share
                    contacts = contactsState.contacts, //.filter {it.consentStatus == ConsentStatus.APPROVED},
                    selectedContactIds = selectedContactIds,
                    onSelectionChange = {selectedContactIds = it},
                    onConfirm = {

                        //SHARE TRIP LOGIC
                        onShareTrip(selectedContactIds.toList())

                        showShareDialog = false
                    },
                    onDismiss = {showShareDialog = false}
                )
            }

            is ContactsViewModel.UiState.Loading, ContactsViewModel.UiState.Idle -> {

                AlertDialog(
                    onDismissRequest = {showShareDialog = false},
                    title = {
                        Text("Loading Contacts")
                    },
                    text = {CircularProgressIndicator()},
                    confirmButton = {}
                )
            }

            is ContactsViewModel.UiState.Error -> {

                AlertDialog(
                    onDismissRequest = {showShareDialog = false},
                    title = {
                        Text("Error")
                    },
                    text = {
                        Text("Failed to load contacts.")
                    },
                    confirmButton = {
                        TextButton(onClick = {showShareDialog = false}) {Text("OK") }
                    }
                )
            }
        }
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

@Composable
fun TripTimer(startedAt:String){
    var elapsedText by remember { mutableStateOf("00.00.00") }
    val startTime = remember(startedAt) {
        try{
            Instant.parse(startedAt)
        }
        catch (e: Exception){
            Instant.now()
        }
    }
    LaunchedEffect(startTime){
        while(true){
            val seconds = java.time.Duration.between(startTime, Instant.now()).seconds
            elapsedText = String.format(Locale.getDefault(), "%02d:%02d:%02d",
                seconds / 3600, (seconds % 3600) / 60, seconds % 60)
            delay(1000)
        }
    }
    Text(text = elapsedText, style = MaterialTheme.typography.labelSmall,
        fontWeight = FontWeight.Bold, color = Color.Black)
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
