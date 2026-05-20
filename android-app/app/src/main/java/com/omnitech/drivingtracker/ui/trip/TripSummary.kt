package com.omnitech.drivingtracker.ui.trip
import androidx.compose.foundation.background
import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.material3.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Settings
import com.omnitech.drivingtracker.ui.components.BottomNavBar
import com.omnitech.drivingtracker.ui.components.ScoreRingTwo
import androidx.compose.material.icons.automirrored.filled.ArrowBack

//Thought that adding this might make integration easier
data class TripSummaryData(
    val date: String = "25 April 2026, 12:45",
    val route: String = "Home --> Office",
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
fun TripSummary(trip: TripSummaryData = TripSummaryData()){


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
            text = "Trip Summary",
            fontWeight = FontWeight.Bold,
            style = MaterialTheme.typography.headlineLarge,
            color = MaterialTheme.colorScheme.onBackground,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
        )

        //Trip time and location
        Card(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.Transparent),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
        ){
            Column(modifier = Modifier.padding(20.dp)){
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
        ){
            Column(
                modifier = Modifier.fillMaxWidth().padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ){
                ScoreRingTwo(
                    score = trip.score,
                    modifier = Modifier.size(140.dp),
                    rating = trip.rating
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        //Trip Details
        Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFEEEEEE))){
            Column(
                modifier = Modifier.padding(20.dp)
            ){
                Text("Trip details", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyMedium)

                Spacer(modifier = Modifier.height(8.dp))

                TripDetailRow("Distance",trip.distance)
                TripDetailRow("Duration",trip.duration)
                TripDetailRow("Average Speed",trip.avgSpeed)
                TripDetailRow("Max Speed", trip.maxSpeed)
                TripDetailRow("Fuel Efficiency",trip.fuelEfficiency)
            }
        }
        Spacer(modifier = Modifier.height(12.dp))

        //Trip Events
        Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFEEEEEE))){
            Column(
                modifier = Modifier.padding(20.dp)
            ){
                Text("Trip Events", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyMedium)

                Spacer(modifier = Modifier.height(8.dp))

                TripDetailRow("Hard Braking",trip.hardBreaking.toString())
                TripDetailRow("Hard Acceleration",trip.hardAcceleration.toString())
                TripDetailRow("Overspeeding",trip.overspeeding.toString())
                TripDetailRow("Cornering",trip.cornering.toString())
                TripDetailRow("Phone Usage",trip.phoneUsage.toString())
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        BottomNavBar()
    }
}

@Composable
fun TripDetailRow(label : String, value : String){
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ){
        Text(label, style = MaterialTheme.typography.bodyMedium)
        Text(value, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
    }
}

@Preview(showBackground=true)
@Composable
fun TripSummaryPreview(){
    DrivingTrackerTheme{
        TripSummary()
    }
}