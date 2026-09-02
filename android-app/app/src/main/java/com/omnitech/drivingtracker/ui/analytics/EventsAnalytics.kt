package com.omnitech.drivingtracker.ui.analytics

import androidx.compose.foundation.background
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
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.omnitech.drivingtracker.Screen
import com.omnitech.drivingtracker.ui.components.YourTopBar
import com.omnitech.drivingtracker.ui.theme.CardWhite
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import com.patrykandpatrick.vico.compose.cartesian.CartesianChartHost
import com.patrykandpatrick.vico.compose.cartesian.axis.HorizontalAxis
import com.patrykandpatrick.vico.compose.cartesian.axis.VerticalAxis
import com.patrykandpatrick.vico.compose.cartesian.data.CartesianChartModelProducer
import com.patrykandpatrick.vico.compose.cartesian.data.columnSeries
import com.patrykandpatrick.vico.compose.cartesian.layer.rememberColumnCartesianLayer
import com.patrykandpatrick.vico.compose.cartesian.rememberCartesianChart
import androidx.compose.foundation.lazy.items
import androidx.compose.runtime.collectAsState
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import com.omnitech.drivingtracker.ui.components.AnalyticsHeader
import com.patrykandpatrick.vico.compose.cartesian.data.columnModel
import androidx.compose.runtime.getValue
import com.patrykandpatrick.vico.compose.cartesian.axis.rememberAxisLabelComponent
import com.patrykandpatrick.vico.compose.cartesian.data.CartesianValueFormatter
import com.patrykandpatrick.vico.compose.common.component.rememberTextComponent

data class EventStat(
    val label: String,
    val count: Int,
    val description: String
)
@Composable
fun EventsAnalytics(navController: NavController ?= null,
                    viewModel: AnalyticsViewModel = hiltViewModel()
){
    val uiState by viewModel.uiState.collectAsState()


    val eventStats = listOf(
        EventStat("Harsh Acceleration", uiState.accelerationEvents, "Accelerating faster " +
                "than your normal driving"),
        EventStat("Harsh Braking",uiState.brakingEvents,"Unsafe, sudden braking on trips.")
    )

    AnalyticsHeader(
        leftWord = "Events ",
        rightWord = "Analytics",
        navController = navController
    ){
        item{
            TotalEvents(uiState.eventCount ?: 0)
            Spacer(modifier = Modifier.height(6.dp))
        }

        item{
            EventsChart(uiState.history)
            Spacer(modifier = Modifier.height(4.dp))
        }

        item{
            Text(
                text = "Breakdown",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(horizontal = 4.dp)
            )
            Spacer(modifier = Modifier.height(4.dp))
        }

        items(eventStats){ stat->
            EventsValuesCard(stat)
        }

        item{
            Spacer(modifier = Modifier.height(4.dp))
        }

        item{
            AboutEvents()
            Spacer(modifier = Modifier.height(4.dp))
        }
    }
}

@Composable
fun TotalEvents(totalEvents: Int){
    Card(
        modifier = Modifier.fillMaxWidth()
            .padding(horizontal = 20.dp),
        colors = CardDefaults.cardColors(containerColor = CardWhite),
        shape = RoundedCornerShape(8.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
    ){
        Column(
            modifier = Modifier.fillMaxWidth()
                .padding(16.dp)
        ) {
            Text(
                text = totalEvents.toString(),
                fontSize = 32.sp,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(6.dp))
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(modifier = Modifier.width(5.dp)
                    .height(18.dp)
                    .background(
                        Color.Black,
                        RoundedCornerShape(4.dp)
                    )
                )
                Spacer(modifier = Modifier.width(8.dp))

                Text(
                    text = "Your total events this month",
                    fontSize = 11.sp
                )
            }
        }
    }
}

@Composable
fun EventsChart(history: List<TripDataPoint>){
    val modelProducer = remember { CartesianChartModelProducer() }
    val counts = history.map {it.eventCount ?: 0}

    LaunchedEffect(counts) {
        if (counts.isNotEmpty()){
            modelProducer.runTransaction {
                columnModel { series(counts) }
            }
        }
    }

    if (counts.isEmpty()){
        return
    }
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = CardWhite),
        shape = RoundedCornerShape(8.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(16.dp)
        ){
            Text(
                text = "Your events per trip",
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(12.dp))

            CartesianChartHost(
                chart = rememberCartesianChart(
                    rememberColumnCartesianLayer(),
                    startAxis = VerticalAxis.rememberStart(
                        label = rememberAxisLabelComponent(),
                        titleComponent = rememberTextComponent(),
                        title = {"Count"}
                    ),
                    bottomAxis = HorizontalAxis.rememberBottom(
                        label = rememberAxisLabelComponent(),
                        titleComponent = rememberTextComponent(),
                        title = {"Date"},
                        valueFormatter = CartesianValueFormatter{
                            _, value, _ ->
                            history.getOrNull(value.toInt())?.date?.takeLast(5) ?: ""
                        }
                    ),
                ),
                modelProducer = modelProducer,
            )
        }
    }
}

@Composable
fun EventsValuesCard(stat: EventStat){
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = CardWhite),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = stat.label,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = stat.description,
                    fontSize = 11.sp
                )
            }

            Spacer(modifier = Modifier.width(8.dp))

            Text(
                text = stat.count.toString(),
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun AboutEvents(){
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = CardWhite),
        shape = RoundedCornerShape(8.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ){
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalAlignment = Alignment.Top
        ){
            Icon(
                imageVector = Icons.Default.Info,
                contentDescription = null,
                modifier = Modifier.size(18.dp)
            )

            Spacer(modifier = Modifier.width(10.dp))

            Column(){
                Text(
                    text = "What are events?",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = "Events are moments during a trip that stand out significantly, " +
                            "such as harsh braking or acceleration. Fewer events generally mean " +
                            "smoother, safer, and more fuel efficient trips.",
                    fontSize = 11.sp
                )
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun EventsAnalyticsPreview(){
    DrivingTrackerTheme {
        EventsAnalytics()
    }
}