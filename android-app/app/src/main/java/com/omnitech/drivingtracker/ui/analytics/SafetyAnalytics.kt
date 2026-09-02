package com.omnitech.drivingtracker.ui.analytics

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.omnitech.drivingtracker.Screen
import com.omnitech.drivingtracker.ui.components.ScoreCard
import com.omnitech.drivingtracker.ui.components.YourTopBar
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme

@Composable
fun SafetyAnalytics(navController: NavController ?= null){

    val ecoScore = 35
    val scoreHistory = listOf(78f,84f,10f, 79f,45f,78f,98f)

    Scaffold(
        topBar = {
            YourTopBar(
                leftIcon = Icons.AutoMirrored.Filled.ArrowBack,
                rightIcon = Icons.Default.Settings,
                leftWord = "Safety ",
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
                    Box(
                        modifier = Modifier.fillMaxWidth(),
                        contentAlignment = Alignment.Center
                    ) {
                        ScoreCard(score = ecoScore ?: 0)
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                }

                item{
                    ScoreChart(
                        title = "Safety Score over time",
                        values = scoreHistory
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                }

                item{
                    QuestionItem(
                        question = "How is my Safety Score calculated?",
                        answer = "Your Safety Score factors in harsh braking, " +
                                "harsh acceleration, speeding, and phone usage events " +
                                "recorded across your recent trips."
                    )
                }
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun SafetyAnalyticsPreview(){
    DrivingTrackerTheme {
        SafetyAnalytics()
    }
}