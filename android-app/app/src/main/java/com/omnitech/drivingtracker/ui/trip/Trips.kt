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
import com.omnitech.drivingtracker.R
import com.omnitech.drivingtracker.data.models.ConsentStatus
import com.omnitech.drivingtracker.data.models.ContactDto
import com.omnitech.drivingtracker.data.models.TripItemDto
import com.omnitech.drivingtracker.ui.components.BottomNavBar
import com.omnitech.drivingtracker.ui.components.ScoreRing
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import com.omnitech.drivingtracker.ui.theme.Green
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

//trip class
//data class Trip(
//    val date: String,
//    val time: String,
//    val from: String,
//    val to: String,
//    val distance: String,
//    val duration: String,
//    val score: Int
//)
import androidx.navigation.NavController
import com.omnitech.drivingtracker.MainActivity

@Composable
fun Trips(
    navController: NavController? = null,
    tripsViewModel: TripsViewModel = viewModel(),
    tripViewModel: TripViewModel = viewModel(),
    contactsViewModel: com.omnitech.drivingtracker.ui.contacts.ContactsViewModel = viewModel()
){

//    val trips = listOf(
//        Trip("Today","17:00","Office","Home","40 km","45 min", 80),
//        Trip("Today","08:15","Home","Office","40 km","50 min", 78),
//        Trip("Yesterday","14:05","Home","Spar","20 km","20 min", 35),
//        Trip("10 May","17:00","Office","Home","40 km","45 min", 80)
//    )
    val tripsState by tripsViewModel.uiState.collectAsState()
    val tripStartState by tripViewModel.tripStartState.collectAsState()
    val contactsState by contactsViewModel.uiState.collectAsState()
    var showStartTripDialog by remember { mutableStateOf(false) }

    val approvedContacts = when (contactsState){
        is com.omnitech.drivingtracker.ui.contacts.ContactsViewModel.UiState.Success -> {
            (contactsState as com.omnitech.drivingtracker.ui.contacts.ContactsViewModel.UiState.Success)
                .contacts
                .filter { it.consentStatus == ConsentStatus.APPROVED }
        }
        else -> emptyList()
    }

    Column(
        modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)
    ){
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ){
            Icon(
                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = "Back",
                tint = MaterialTheme.colorScheme.onBackground
            )
            Row{
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
                Button(onClick = {showStartTripDialog = true}, colors = ButtonDefaults.buttonColors(containerColor = Green)){
                    Icon(Icons.Default.Add, contentDescription = null, modifier=Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Start new trip")
                }
                when(tripStartState){
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
                            text = (tripStartState as TripViewModel.UiState.Error).message ?: "Failed to start trip",
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
        ){
            Text("Past", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Icon(Icons.Default.Tune, contentDescription = "Filter", tint = MaterialTheme.colorScheme.onBackground)
        }

        //Trips
//        Column(
//            modifier = Modifier.weight(1f).verticalScroll(rememberScrollState())
//                .padding(horizontal=16.dp),
//            verticalArrangement = Arrangement.spacedBy(12.dp)
//        ){
//            trips.forEachIndexed {
//                    index,trip -> TripCard(trip=trip, isLatest = index == 0) //display trip card for each trip in the class
//            }
//        }

        when(tripsState){
            is TripsViewModel.UiState.Loading, is TripsViewModel.UiState.Idle -> {
                Box(
                    modifier = Modifier.weight(1f).fillMaxWidth(),
                    contentAlignment = Alignment.Center
                ){
                    CircularProgressIndicator()
                }
            }
            is TripsViewModel.UiState.Error -> {
                val error = tripsState as TripsViewModel.UiState.Error
                Box(
                    modifier = Modifier.weight(1f).fillMaxWidth(),
                    contentAlignment = Alignment.Center
                ){
                    Column(horizontalAlignment = Alignment.CenterHorizontally){
                        Text(
                            text = error.message ?: "Failed to load trips",
                            color = MaterialTheme.colorScheme.error
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Button(onClick = { tripsViewModel.loadTripsHistory() }){
                            Text("Retry")
                        }
                    }
                }
            }
            is TripsViewModel.UiState.Success -> {
                val trips = (tripsState as TripsViewModel.UiState.Success).trips
                if (trips.isEmpty()){
                    Box(
                        modifier = Modifier.weight(1f).fillMaxWidth(),
                        contentAlignment = Alignment.Center
                    ){
                        Text(
                            text = "No trips yet",
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }else{
                    Column(
                        modifier = Modifier.weight(1f)
                            .verticalScroll(rememberScrollState())
                            .padding(horizontal = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ){
                        trips.forEachIndexed { index, trip ->
                            TripCard(trip = trip, isLatest = index == 0)
                        }
                    }
                }
            }
        }
        BottomNavBar(navController = navController)
    }

    if(showStartTripDialog){
        StartTripDialog(
            approvedContacts = approvedContacts,
            onDismiss = { showStartTripDialog = false },
            onStartTrip = { vehicleId, dataSource, latitude, longitude, contactIds ->
                tripViewModel.startTrip(
                    vehicleId = vehicleId,
                    dataSource = dataSource,
                    latitude = latitude,
                    longitude = longitude,
                    selectedContactIds = contactIds.ifEmpty { null }
                )
                showStartTripDialog = false
            }
        )
    }
}

@Composable
private fun StartTripDialog(
    approvedContacts: List<ContactDto>,
    onDismiss: () -> Unit,
    onStartTrip: (vehicleId: String, dataSource: String, latitude: Double, longitude: Double, contactIds: List<String>) -> Unit
) {
    var vehicleId by rememberSaveable { mutableStateOf("") }
    var dataSource by rememberSaveable { mutableStateOf("PHONE") }
    var latitude by rememberSaveable { mutableStateOf("") }
    var longitude by rememberSaveable { mutableStateOf("") }
    var selectedContactIds by remember { mutableStateOf(setOf<String>()) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Start Trip") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = vehicleId,
                    onValueChange = { vehicleId = it },
                    label = { Text("Vehicle ID") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = dataSource,
                    onValueChange = { dataSource = it },
                    label = { Text("Data source") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = latitude,
                        onValueChange = { latitude = it },
                        label = { Text("Latitude") },
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = longitude,
                        onValueChange = { longitude = it },
                        label = { Text("Longitude") },
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                }

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
                                    Text(contact.name, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                                    Text(contact.username, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
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
                if (vehicleId.isNotBlank() && lat != null && lng != null) {
                    onStartTrip(vehicleId.trim(), dataSource.trim(), lat, lng, selectedContactIds.toList())
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
            Instant.parse(value).atZone(ZoneId.systemDefault()).format(DateTimeFormatter.ofPattern("dd MMM"))
        }
    }.getOrDefault("Unknown")
}

private fun formatTripTime(value: String?): String {
    return runCatching {
        if (value.isNullOrBlank()) {
            "Unknown"
        } else {
            Instant.parse(value).atZone(ZoneId.systemDefault()).format(DateTimeFormatter.ofPattern("HH:mm"))
        }
    }.getOrDefault("Unknown")
}

private fun formatTripDistance(value: Double?): String {
    return value?.let { "${String.format(Locale.getDefault(), "%.1f", it)} km" } ?: "-- km"
}

private fun formatTripDuration(value: Int?): String {
    return value?.let { "$it min" } ?: "-- min"
}

private fun formatTripScore(trip: TripItemDto): Int {
    return trip.trip_scores?.firstOrNull()?.overallScore?.toInt()?.coerceIn(0, 100) ?: 0
}


@Composable
fun TripCard(trip: TripItemDto, isLatest: Boolean = false) {

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFEEEEEE)),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ){
        Column{
            if (isLatest){ //expands the details (map) of the latest trip
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
//                Text(trip.from, style = MaterialTheme.typography.bodyMedium)
//                Text(trip.to, style = MaterialTheme.typography.bodyMedium)
                Text(trip.vehicleId ?: "Vehicle not set", style = MaterialTheme.typography.bodyMedium)
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
                    onClick = {},
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

@Preview(showBackground=true)
@Composable
fun TripsPreview(){
    DrivingTrackerTheme{
        Trips()
    }
}