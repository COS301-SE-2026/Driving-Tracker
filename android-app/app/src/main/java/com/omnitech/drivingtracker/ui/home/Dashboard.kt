package com.omnitech.drivingtracker.ui.home

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.unit.dp
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.omnitech.drivingtracker.ui.theme.*
import androidx.compose.ui.graphics.PaintingStyle.Companion.Stroke
import com.omnitech.drivingtracker.ui.components.BottomNavBar
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.ui.res.painterResource
import com.omnitech.drivingtracker.R
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Settings
import com.omnitech.drivingtracker.ui.components.ScoreCard
import com.omnitech.drivingtracker.ui.components.StatCard
import com.omnitech.drivingtracker.ui.components.TopBar
import com.omnitech.drivingtracker.ui.components.ScoreRing
import com.omnitech.drivingtracker.ui.components.RecentTripCard
import androidx.compose.foundation.*

@Composable
fun Dashboard() {

    Scaffold(

        topBar = {
            TopBar(
                leftIcon = Icons.Default.Menu,
                rightIcon = Icons.Default.Settings,
                onLeftClick = {/*Open menu*/},
                onRightClick = {/*Open settings*/}
            )
        },

        bottomBar = {
            BottomNavBar()
        }

    ) { innerPadding -> 

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.Top
        ){

            //Overal driving score
            Box(
                modifier = Modifier
                    .weight(1.3f)
                    .fillMaxWidth(),
                contentAlignment = Alignment.Center
            ) {
                ScoreCard(score = 85)
            }

            Spacer(modifier = Modifier.height(16.dp))

            //"This week..."
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {

                Text(
                    "This Week",
                    style = MaterialTheme.typography.titleMedium
                )

                Text(
                    "vs Last Week",
                    style = MaterialTheme.typography.labelSmall,
                    color = Color.Gray
                )

            }

            Spacer(modifier = Modifier.height(8.dp))

            //This week cards
            Column(
                modifier = Modifier
                    .weight(1.5f)
                    .fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Row(
                    modifier = Modifier.weight(1f),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    //Distance card
                    StatCard(
                        label = "Distance",
                        value = 250,
                        unit = "km",
                        icon = painterResource(id = R.drawable.stats_distance),
                        percentage = 5,
                        modifier = Modifier.weight(1f)
                    )
                    //Driving Time card
                    StatCard(
                        label = "Driving Time",
                        value = 25,
                        unit = "mins",
                        icon = painterResource(id = R.drawable.stats_time),
                        percentage = -5,
                        modifier = Modifier.weight(1f)
                    )

                }
                Row(
                    modifier = Modifier.weight(1f),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    //Fuel Efficiency
                    StatCard(
                        label = "Fuel Efficiency",
                        value = 250,
                        unit = "km/l",
                        icon = painterResource(id = R.drawable.stats_fuel),
                        percentage = 5,
                        modifier = Modifier.weight(1f)
                    )
                    //Trips
                    StatCard(
                        label = "Trips",
                        value = 15,
                        icon = painterResource(id = R.drawable.stats_trips),
                        percentage = 5,
                        modifier = Modifier.weight(1f)
                    )

                }
            }


            Spacer(modifier = Modifier.height(16.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {

                Text(
                    "Recent trip",
                    style = MaterialTheme.typography.titleMedium
                )

                Text(
                    "View more",
                    style = MaterialTheme.typography.labelSmall,
                    color = Color.Gray
                )

            }

            Spacer(modifier = Modifier.height(8.dp))

            //Recent trip card

            RecentTripCard(
                startLoc = "Home",
                destination = "Office",
                distance = 40,
                drivingTime = 50,
                startTime = "08:15",
                tripScore = 78
            )



        }

    }

}



@Preview(showBackground=true)
@Composable
fun DashboardPreview(){
    DrivingTrackerTheme{
        Dashboard()
    }
}