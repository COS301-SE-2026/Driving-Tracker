package com.omnitech.drivingtracker.ui.challenges

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.omnitech.drivingtracker.ui.components.TopBar
import com.omnitech.drivingtracker.ui.components.BottomNavBar
import com.omnitech.drivingtracker.ui.components.ScoreRing
import com.omnitech.drivingtracker.ui.home.Dashboard
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme

@Composable
fun WeeklyChallenges(navController: NavController? = null) {

    Scaffold(
        topBar = {
            TopBar(
                leftIcon = Icons.AutoMirrored.Filled.ArrowBack,
                rightIcon = Icons.Default.Settings,
                onLeftClick = { navController?.popBackStack() },
                onRightClick = { /*handle settings click*/ }
            )
        },
        bottomBar = {
            BottomNavBar(navController = navController, color = "none")
        }
    ) { paddingValues ->
        LazyColumn(
            modifier =  Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                //Rank and score cards
            }

            item{
                //This weeks challenges
            }

        }
    }

}

@Preview(showBackground = true)
@Composable
fun ChallengesPreview() {
    DrivingTrackerTheme {
        WeeklyChallenges()
    }
}