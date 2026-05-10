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
import com.omnitech.drivingtracker.ui.theme.Green
import androidx.compose.ui.graphics.PaintingStyle.Companion.Stroke
import com.omnitech.drivingtracker.ui.components.BottomNavBar

@Composable
fun Dashboard() {

    Scaffold(
        bottomBar = {
            BottomNavBar()
        }
    ) { innerPadding -> 
        Box(modifier = Modifier.padding(innerPadding)) {
            //Using lazy column so that user may be able to scroll through dashboard if there are many cards
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(24.dp)
            ){
                item {
                    //Your Driving score
                }

                item{ //This week cards
                    Column (verticalArrangement = Arrangement.spacedBy(16.dp)){
                        Row(horozontalArrangement = Arrangement.spacedBy(16.dp)) {
                            Card(modifier = Modifier.weight(1f)) {/*Distance card*/}
                            Card(modifier = Modifier.weight(1f)) {/*Distance card*/}
                        }
                        Row(horozontalArrangement = Arrangement.spacedBy(16.dp)) {
                            Card(modifier = Modifier.weight(1f)) {/*Distance card*/}
                            Card(modifier = Modifier.weight(1f)) {/*Distance card*/}
                        }
                    }
                }

                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween 
                    ) {
                        //1. Trip Icon
                        //2. Trip details
                        Column(

                        ) {
                            Text("Today, 0815")
                            Text("Home      40km")
                            Text("Office    50 min)
                        }
                        //3. Score
                        Text("78")//Gonna add score ring around
                    }
                }
            }
        }
    }

}

//Using lazy column so that user may be able to scroll through dashboard if there are many cards
LazyColumn(
    modifier = Modifier.fillMaxSize(),
    verticalArrangement = Arrangement.spacedBy(24.dp)
){
    item {
        //Your Driving score
    }

    item{ //This week cards
        Column (verticalArrangement = Arrangement.spacedBy(16.dp)){
            Row(horozontalArrangement = Arrangement.spacedBy(16.dp)) {
                Card(modifier = Modifier.weight(1f)) {/*Distance card*/}
                Card(modifier = Modifier.weight(1f)) {/*Distance card*/}
            }
            Row(horozontalArrangement = Arrangement.spacedBy(16.dp)) {
                Card(modifier = Modifier.weight(1f)) {/*Distance card*/}
                Card(modifier = Modifier.weight(1f)) {/*Distance card*/}
            }
        }
    }

    item {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween 
        ) {
            //1. Trip Icon
            //2. Trip details
            Column(

            ) {
                Text("Today, 0815")
                Text("Home      40km")
                Text("Office    50 min)
            }
            //3. Score
            Text("78")//Gonna add score ring around
        }
    }
}
