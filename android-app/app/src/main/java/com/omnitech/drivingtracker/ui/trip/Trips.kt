package com.omnitech.drivingtracker.ui.trip
import androidx.compose.foundation.background
import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.omnitech.drivingtracker.ui.theme.Green
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Tune
import com.omnitech.drivingtracker.ui.components.BottomNavBar
import com.omnitech.drivingtracker.ui.components.ScoreRing
import androidx.compose.foundation.Image
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.ui.res.painterResource
import com.omnitech.drivingtracker.R
import androidx.compose.ui.layout.ContentScale

//trip class
data class Trip(
    val date: String,
    val time: String,
    val from: String,
    val to: String,
    val distance: String,
    val duration: String,
    val score: Int
)
@Composable
fun Trips(){

    val trips = listOf(
        Trip("Today","17:00","Office","Home","40 km","45 min", 80),
        Trip("Today","08:15","Home","Office","40 km","50 min", 78),
        Trip("Yesterday","14:05","Home","Spar","20 km","20 min", 35),
        Trip("10 May","17:00","Office","Home","40 km","45 min", 80)
    )

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
                Button(onClick = {}, colors = ButtonDefaults.buttonColors(containerColor = Green)){
                    Icon(Icons.Default.Add, contentDescription = null, modifier=Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Start new trip")
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
        Column(
            modifier = Modifier.weight(1f).verticalScroll(rememberScrollState())
                .padding(horizontal=16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ){
            trips.forEachIndexed {
                    index,trip -> TripCard(trip=trip, isLatest = index == 0) //display trip card for each trip in the class
            }
        }
        BottomNavBar()
    }
}
@Composable
fun TripCard(trip: Trip, isLatest: Boolean = false) {

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFEEEEEE)),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
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
                    "${trip.date}, ${trip.time}",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold
                )
                Text(trip.from, style = MaterialTheme.typography.bodyMedium)
                Text(trip.to, style = MaterialTheme.typography.bodyMedium)
            }

            //distance and duration
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(trip.distance, style = MaterialTheme.typography.bodyMedium)
                Text(trip.duration, style = MaterialTheme.typography.bodyMedium)
            }

            Spacer(modifier = Modifier.width(12.dp))

            //score and see more

            Column(horizontalAlignment = Alignment.CenterHorizontally) {

                //score ring
                ScoreRing(
                    score = trip.score,
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