package com.omnitech.drivingtracker.ui.auth
import androidx.compose.foundation.background
import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.Tune
import com.omnitech.drivingtracker.ui.components.BottomNavBar
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.Warning


@Composable
fun LiveTrip(){
    data class LiveTripSummary(
        val distanceKm: String,
        val time: String,
        val avgSpeed: String,
        val fuelEfficiency: String
    )
    Column{
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ){
            Icon(
                imageVector = Icons.Default.ArrowDownward,
                contentDescription = "Back",
                tint = MaterialTheme.colorScheme.onBackground
            )
            Row{
                Text(
                    text = "Live Trip ",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = MaterialTheme.colorScheme.onBackground
                )
            }
            Icon(
                imageVector = Icons.Default.Settings,
                contentDescription = "Settings",
                tint = MaterialTheme.colorScheme.onBackground
            )

            //Map
            Box(modifier = Modifier.fillMaxSize().background(Color(0xFFD0D8E0)))
            //recording badge
            Card(
                modifier = Modifier.align(Alignment.TopStart).padding(8.dp),
                shape = RoundedCornerShape(50)
            ){
                Row(modifier = Modifier.size(horizontal = 8.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ){
                    Box(modifier = Modifier.size(8.dp).background(Color.Red, CircleShape))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Recording", style = MaterialTheme.typography.labelSmall)
                }
            }

            //Timer
            Card(
                modifier = Modifier.align(Alignment.TopEnd).padding(8.dp),
                shape = RoundedCornerShape(50)
            ){
                Text("00:35:24", modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                    style = MaterialTheme.typography.labelSmall
                )
            }

            //Speed and fuel for trips
            Column(
                modifier = Modifier.align(Alignment.BottomEnd).padding(8.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ){
                Card(shape = RoundedCornerShape(8.dp)){
                    Row(modifier = Modifier.padding(8.dp), verticalAlignment = Alignment.Center){
                        Icon(Icons.Default.Speed, contentDescription = null, modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Column{
                            Text("82 km/h", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
                            Text("Speed", style = MaterialTheme.typography.labelSmall)
                        }
                    }
                }
                Card(shape = RoundedCornerShape(8.dp)){
                    Row(modifier = Modifier.padding(8.dp), verticalAlignment = Alignment.CenterVertically){
                        Text("ECO", fontSize = 16.sp)
                        Spacer(modifier = Modifier.width(4.dp))
                        Column{
                            Text("7.4 km/l", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
                            Text("Fuel Efficiency", style = MaterialTheme.typography.labelSmall)
                        }
                    }
                }
            }
    }
        BottomNavBar()
}


@Preview(showBackground=true)
@Composable
fun LiveTripPreview(){
    DrivingTrackerTheme{
        LiveTrip()
    }
}