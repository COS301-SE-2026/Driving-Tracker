package com.omnitech.drivingtracker.ui.analytics
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.SentimentNeutral
import androidx.compose.material.icons.filled.SentimentVeryDissatisfied
import androidx.compose.material.icons.filled.SentimentVerySatisfied
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.omnitech.drivingtracker.Screen
import com.omnitech.drivingtracker.ui.components.YourTopBar
import com.omnitech.drivingtracker.ui.theme.CardWhite
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import androidx.compose.runtime.*
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import com.omnitech.drivingtracker.data.models.FuelHistoryPointDto
import com.patrykandpatrick.vico.compose.cartesian.CartesianChartHost
import com.patrykandpatrick.vico.compose.cartesian.axis.HorizontalAxis
import com.patrykandpatrick.vico.compose.cartesian.axis.VerticalAxis
import com.patrykandpatrick.vico.compose.cartesian.data.CartesianChartModelProducer
import com.patrykandpatrick.vico.compose.cartesian.data.CartesianValueFormatter
import com.patrykandpatrick.vico.compose.cartesian.data.lineModel
import com.patrykandpatrick.vico.compose.cartesian.data.lineSeries
import com.patrykandpatrick.vico.compose.cartesian.layer.rememberLineCartesianLayer
import com.patrykandpatrick.vico.compose.cartesian.rememberCartesianChart

data class FuelEfficiencyTip(
    val title: String,val description: String
)

val fuelEfficiencyTips = listOf(
    FuelEfficiencyTip(
        title = "Accelerate smoothly",
        description = "Avoid sudden acceleration to reduce unnecessary fuel consumption."
    ),
    FuelEfficiencyTip(
        title = "Maintain a steady speed",
        description = "Try to avoid unnecessary changes in speed when possible."
    ),
    FuelEfficiencyTip(
        title = "Avoid unnecessary idling",
        description = "Turn off the engine when stopped for extended periods."
    )
)

@Composable
fun FuelAnalytics(navController: NavController ?= null,
                  viewModel: FuelAnalyticsViewModel = hiltViewModel()
){

    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            YourTopBar(
                leftIcon = Icons.AutoMirrored.Filled.ArrowBack,
                rightIcon = Icons.Default.Settings,
                leftWord = "Fuel ",
                rightWord = "Analytics",
                onLeftClick = { navController?.popBackStack()},
                onRightClick = {navController?.navigate(Screen.Settings.route)}
            )
        }
    ) {
        paddingValues ->
        Box(
            modifier = Modifier.fillMaxSize()
                .padding(paddingValues)
        ){
            LazyColumn(
                modifier = Modifier.fillMaxSize()
                    .padding(horizontal = 16.dp),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                //Total card
                item{
                    TotalCard()
                }
                //Graph
                item{
                    FuelGraph(history = uiState.history)
                }
                //Stats
                item{
                    StatsCard()
                }
                //How to improve
                item{
                    TipsSection()
                }
            }
        }
    }
}

@Composable
fun TotalCard(){
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = CardWhite
        ),
        shape = RoundedCornerShape(8.dp),
        elevation = CardDefaults.cardElevation(
            defaultElevation = 6.dp
        )
    ){
        Column(
            modifier = Modifier.fillMaxWidth()
                .padding(16.dp)
        ) {

            Text(
                text = "7.28 L/100 km",
                fontSize = 32.sp,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(6.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End
            ) {

                Text(
                    text = "⬆ 0.6 L/100 km from last month",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.secondary
                )
            }

            Spacer(
                modifier = Modifier.height(14.dp)
            )

            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier.width(5.dp)
                        .height(18.dp)
                        .background(
                            Color.Black,
                            RoundedCornerShape(4.dp)
                        )
                )

                Spacer(modifier = Modifier.width(8.dp))

                Text(
                    text = "Your average fuel consumption for all trips",
                    fontSize = 11.sp
                )
            }
        }
    }
}

@Composable
fun StatsCard(){
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = CardWhite
        ),
        shape = RoundedCornerShape(8.dp),
        elevation = CardDefaults.cardElevation(
            defaultElevation = 4.dp
        )
    ) {
        Column(
            modifier = Modifier.fillMaxWidth()
                .padding(16.dp)
        ){
            Text(
                text = "Fuel Stats",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(10.dp))

            FuelStat(
                icon = Icons.Filled.SentimentVerySatisfied,
                label = "Best",
                value = "6.4 L/100 km"
            )

            Spacer(modifier = Modifier.height(6.dp))

            FuelStat(
                icon = Icons.Filled.SentimentNeutral,
                label = "Average",
                value = "7.28 L/100 km"
            )

            Spacer(modifier = Modifier.height(6.dp))

            FuelStat(
                icon = Icons.Filled.SentimentVeryDissatisfied,
                label = "Worst",
                value = "8.1 L/100 km"
            )

        }
    }
}

@Composable
fun FuelStat(
    icon: ImageVector,
    label: String,
    value: String
){
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ){

        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(20.dp),
                tint = MaterialTheme.colorScheme.primary
            )

            Spacer(modifier = Modifier.width(8.dp))

            Text(
                text = label,
                fontSize = 12.sp
            )
        }

        Text(
            text = value,
            fontSize = 12.sp
        )
    }
}

@Composable
fun TipsSection(){
    var expanded by remember { mutableStateOf(false) }

    Column(modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.fillMaxWidth()
                .clickable{
                    expanded = !expanded
                }
                .padding(
                    vertical = 8.dp
                ),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "How to improve my Fuel Efficiency",
                modifier = Modifier.weight(1f),
                fontSize = 18.sp,
                fontWeight = FontWeight.Medium
            )

            Icon(
                imageVector = if (expanded)
                Icons.Default.ExpandLess
                        else
                Icons.Default.ExpandMore,

                contentDescription = null
            )
        }
        if (expanded){
            Column(
                modifier = Modifier.fillMaxWidth()
                    .padding(top = 8.dp)
            ){
                fuelEfficiencyTips.forEach{
                    tip->
                    TipsCard(
                        title = tip.title,
                        description = tip.description
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                }
            }
        }
    }
}

@Composable
fun TipsCard(
    title: String,
    description: String
){
    Column(
        modifier = Modifier.fillMaxWidth()
            .background(
                Color.White,
                RoundedCornerShape(8.dp)
            )
            .padding(12.dp)
    ){
        Text(
            text = title,
            fontSize = 15.sp,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(4.dp))

        Text(
            text = description,
            fontSize = 13.sp,
            color = Color.DarkGray
        )
    }
}

@Composable
fun FuelGraph(history: List<FuelHistoryPointDto>){
    //y axis: fuel efficiency L/100Km
    //x axis: dates

    val modelProducer = remember { CartesianChartModelProducer() }

    LaunchedEffect(history) { //everytime there is new data in hist, re-fetch
        if (history.isEmpty())
            return@LaunchedEffect
        modelProducer.runTransaction {
            lineModel{
                series(history.map { it.efficiencyLPer100Km ?: 0.0 })
            }
        }
    }

    if (history.isEmpty()){
        Text(
            text = "There is not enough trip data yet.",
            fontSize = 12.sp,
            color = Color.Black,
            modifier = Modifier.fillMaxWidth()
                .padding(vertical = 24.dp)
        )
        return
    }
    else {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = CardWhite),
            shape = RoundedCornerShape(8.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
        ){
            Column(modifier = Modifier.fillMaxWidth()
                .padding(16.dp)
            ) {

                Text(
                    text = "Fuel Efficiency over your trips",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(10.dp))

                CartesianChartHost(
                    chart = rememberCartesianChart(
                        rememberLineCartesianLayer(),
                        startAxis = VerticalAxis.rememberStart(
                            title = {"L/100km"}
                        ),
                        bottomAxis = HorizontalAxis.rememberBottom(
                            title = {"Date"},
                            valueFormatter = CartesianValueFormatter{
                                _,value,_-> //get the fuel efficiency hist and take only the day & month
                                history.getOrNull(value.toInt())?.date?.takeLast(5) ?:""
                            }
                        ),
                    ),
                    modelProducer = modelProducer,
                    modifier = Modifier.fillMaxWidth().height(280.dp)
                )
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun FuelAnalyticsPreview(){
    DrivingTrackerTheme {
        FuelAnalytics()
    }
}