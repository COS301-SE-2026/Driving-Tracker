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
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.navigation.NavController
import com.omnitech.drivingtracker.Screen
import com.omnitech.drivingtracker.ui.components.AnalyticsHeader
import com.omnitech.drivingtracker.ui.components.ScoreCard
import com.omnitech.drivingtracker.ui.components.YourTopBar
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import androidx.compose.runtime.getValue

@Composable
fun SafetyAnalytics(navController: NavController ?= null,
                    viewModel: AnalyticsViewModel = hiltViewModel()
){

    val uiState by viewModel.uiState.collectAsState()
    val safetyHistory = uiState.history.filter { it.safetyScore != null }
    val scores = safetyHistory.map { it.safetyScore!!.toFloat() }


    AnalyticsHeader(
        leftWord = "Safety ",
        rightWord = "Analytics",
        navController = navController
    ) {
        item{
            Box(
                modifier = Modifier.fillMaxWidth(),
                contentAlignment = Alignment.Center
            ) {
                ScoreCard(score = uiState.safetyScore ?: 0)
            }
            Spacer(modifier = Modifier.height(8.dp))
        }

        item{
            ScoreChart(
                title = "Safety Score over time",
                scores = scores,
                history = safetyHistory
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

@Preview(showBackground = true)
@Composable
fun SafetyAnalyticsPreview(){
    DrivingTrackerTheme {
        SafetyAnalytics()
    }
}