package com.omnitech.drivingtracker.ui.analytics

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Eco
import androidx.compose.material.icons.filled.LocalGasStation
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.Alignment
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.omnitech.drivingtracker.Screen
import com.omnitech.drivingtracker.ui.components.*
import com.omnitech.drivingtracker.ui.theme.CardWhite
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import java.util.Locale

@Composable
fun DriverAnalytics(navController: NavController ?= null){

    //val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            YourTopBar(
                leftIcon = Icons.AutoMirrored.Filled.ArrowBack,
                rightIcon = Icons.Default.Settings,
                leftWord = "Your ",
                rightWord = "Analytics",
                onLeftClick = { navController?.popBackStack() },
                onRightClick = { navController?.navigate(Screen.Settings.route) }
            )
        }
    ){
        paddingValues ->
        Box(modifier = Modifier.fillMaxSize().padding(paddingValues)){
            LazyColumn(
                modifier = Modifier.fillMaxSize()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                //Driving Score
                item {
                    Box(
                        modifier = Modifier.fillMaxWidth(),
                        contentAlignment = Alignment.Center
                    ) {
                        ScoreCard(score = 92)
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                }
                //Description
                item{
                    Text(
                        "You're driving well! \n" +
                                "Your score has improved because you've had " +
                                "fewer harsh events recently.",
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center,
                        style = MaterialTheme.typography.bodyLarge
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                }

                item{
                    HLine()
                }
                //Trip Summary
                item{
                    Column(
                        modifier = Modifier.padding(start = 16.dp,end = 16.dp ,bottom = 24.dp)
                    ) {
                        Text(
                            "App Journey",
                            fontWeight = FontWeight.Bold,
                            fontSize = 22.sp
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ){
                            TripsAnalytic("24 km","Distance", modifier = Modifier.weight(1f), true)
                            TripsAnalytic("24","Trips", modifier = Modifier.weight(1f), true)
                            TripsAnalytic("11h 42m","Time", modifier = Modifier.weight(1f), true)
                        }
                    }
                }

                item{
                    HLine()
                }

                //Performance cards
                item{
                    PerformanceSection(91,84,7.2,6)
                }

                item{
                    HLine()
                }

                //Driving Insights or Things to improve

            }
        }
    }
}

@Composable
fun TripsAnalytic(

    value: String,
    label: String,
    modifier: Modifier = Modifier,
    elevated: Boolean = false

){
    Card(modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = CardWhite),
        shape = RoundedCornerShape(12.dp),
        elevation = if (elevated) CardDefaults.cardElevation(defaultElevation = 12.dp) else CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(modifier = Modifier.padding(vertical = 16.dp,
            horizontal = 8.dp)
            .fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally) {
            Text(value, fontWeight = FontWeight.Bold, fontSize = 18.sp)
            Spacer(modifier = Modifier.height(4.dp))
            Text(label, style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
fun HLine(){
    HorizontalDivider(
        modifier = Modifier.fillMaxWidth()
            .padding(horizontal = 16.dp),
        thickness = 1.dp,
        color = MaterialTheme.colorScheme.outlineVariant
    )
}

@Composable
fun PerformanceCard(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    value: String,
    unit: String?,
    accentColor: Color,
    modifier: Modifier = Modifier
){
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 12.dp)
    ){
        Column(
            modifier = Modifier.padding(14.dp)
        ){
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ){
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ){
                    Icon(icon,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp),
                        tint = accentColor
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(title,
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Medium
                    )
                }
                //Arrow that takes you to the respective analysis category
                Icon(
                    Icons.Default.ChevronRight,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(value,
                fontWeight = FontWeight.Bold,
                fontSize = 30.sp,
                color = accentColor
            )
            Text(unit ?: "",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
fun PerformanceSection(
    safety: Int,
    eco: Int,
    fuel: Double,
    events: Int
){
    Column(
        modifier = Modifier.padding(horizontal = 16.dp)
    ){
        Text("Performance",
            fontWeight = FontWeight.Bold,
            fontSize = 22.sp
        )
        Spacer(modifier = Modifier.height(16.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ){
            PerformanceCard(
                icon = Icons.Default.Shield,
                title = "Safety",
                value = "$safety",
                unit = "/100",
                accentColor = MaterialTheme.colorScheme.tertiary,
                modifier = Modifier.weight(1f)
            )
            PerformanceCard(
                icon = Icons.Default.Eco,
                title = "Eco",
                value = "$eco",
                unit = "/100",
                accentColor = MaterialTheme.colorScheme.primary,
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ){
            PerformanceCard(
                icon = Icons.Default.LocalGasStation,
                title = "Fuel",
                value = String.format(Locale.getDefault(),"%.1f", fuel),
                unit = "L/100",
                accentColor = MaterialTheme.colorScheme.primary,
                modifier = Modifier.weight(1f)
            )
            PerformanceCard(
                icon = Icons.Default.Warning,
                title = "Events",
                value = "$events",
                unit = "",
                accentColor = MaterialTheme.colorScheme.tertiary,
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Preview(showBackground = true)
@Composable
fun AnalyticsPreview(){
    DrivingTrackerTheme {
        DriverAnalytics()
    }
}