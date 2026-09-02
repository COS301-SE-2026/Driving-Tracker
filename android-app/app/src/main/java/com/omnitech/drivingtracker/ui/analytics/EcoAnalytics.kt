package com.omnitech.drivingtracker.ui.analytics

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.wrapContentSize
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.omnitech.drivingtracker.Screen
import com.omnitech.drivingtracker.ui.components.ScoreCard
import com.omnitech.drivingtracker.ui.components.YourTopBar
import com.omnitech.drivingtracker.ui.theme.CardWhite
import com.patrykandpatrick.vico.compose.cartesian.CartesianChartHost
import com.patrykandpatrick.vico.compose.cartesian.axis.HorizontalAxis
import com.patrykandpatrick.vico.compose.cartesian.axis.VerticalAxis
import com.patrykandpatrick.vico.compose.cartesian.data.CartesianChartModelProducer
import com.patrykandpatrick.vico.compose.cartesian.data.lineSeries
import com.patrykandpatrick.vico.compose.cartesian.layer.rememberLineCartesianLayer
import com.patrykandpatrick.vico.compose.cartesian.rememberCartesianChart
import androidx.compose.runtime.getValue
import com.patrykandpatrick.vico.compose.cartesian.data.lineModel
import androidx.compose.runtime.setValue
import androidx.compose.ui.tooling.preview.Preview
import com.omnitech.drivingtracker.ui.components.ScoreRing
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme

@Composable
fun EcoAnalytics(navController: NavController ?= null){

    val ecoScore = 85
    val scoreHistory = listOf(80f,84f,79f,45f,78f,98f)

    Scaffold(
        topBar = {
            YourTopBar(
                leftIcon = Icons.AutoMirrored.Filled.ArrowBack,
                rightIcon = Icons.Default.Settings,
                leftWord = "Eco ",
                rightWord = "Analytics",
                onLeftClick = { navController?.popBackStack()},
                onRightClick = {navController?.navigate(Screen.Settings.route)}
            )
        }
    ) {
            paddingValues->
        Box(
            modifier = Modifier.fillMaxSize()
                .padding(paddingValues)
        ){
            LazyColumn(
                modifier = Modifier.fillMaxSize()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item{
                    ScoreCard(score = ecoScore ?: 0)
                    Spacer(modifier = Modifier.height(8.dp))
                }

                item{
                    ScoreChart(title = "Eco Score over time", values = scoreHistory)
                    Spacer(modifier = Modifier.height(8.dp))
                }

                item{
                    QuestionItem(
                        question = "Eco driving recommendations",
                        answer = "Try smoother acceleration, less harsh breaking" +
                                ", keeping a steady speed and releasing the accelerator " +
                                "when approaching a red light."
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                }

                item{
                    QuestionItem(
                        question = "How is my Eco Score Calculated?",
                        answer = "Your Eco Score looks at fuel-efficient driving " +"patterns. " +
                                "If your fuel efficiency is good, you will have a better eco score."
                    )
                }

                item{Spacer(modifier = Modifier.height(8.dp))}
            }
        }
    }
}

@Composable
fun ScoreChart(title: String, values: List<Float>){
    val modelProducer = remember { CartesianChartModelProducer() }

    LaunchedEffect(values) {
        modelProducer.runTransaction {
            lineModel {series(values)}
        }
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = CardWhite),
        shape = RoundedCornerShape(8.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ){
        Column(
            modifier = Modifier.fillMaxWidth().padding(16.dp)
        ){
            Text(
                text = title,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(12.dp))

            CartesianChartHost(
                chart = rememberCartesianChart(
                    rememberLineCartesianLayer(),
                    startAxis = VerticalAxis.rememberStart(),
                    bottomAxis = HorizontalAxis.rememberBottom(),
                ),
                modelProducer = modelProducer
            )
        }
    }
}

@Composable
fun QuestionItem(question: String, answer: String){
    var expanded by remember { mutableStateOf(false) }
    val rotation by animateFloatAsState(
        targetValue = if (expanded){
        180f
        }else{
            0f
        },
        label = "chevronRotation"
    )

    Column(
        modifier = Modifier.fillMaxWidth()
            .clickable {expanded = !expanded}
            .padding(vertical = 12.dp)
    ){
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ){
            Text(
                text = question,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.weight(1f)
            )
            Icon(
                imageVector = Icons.Default.KeyboardArrowDown,
                contentDescription = if (expanded) "Collapse" else "Expand",
                modifier = Modifier.rotate(rotation)
            )
        }
        AnimatedVisibility(visible = expanded) {
            Text(
                text = answer,
                fontSize = 12.sp,
                modifier = Modifier.padding(top = 8.dp)
            )
        }
    }
}

@Preview(showBackground = true)
@Composable
fun EcoAnalyticsPreview(){
    DrivingTrackerTheme {
        EcoAnalytics()
    }
}