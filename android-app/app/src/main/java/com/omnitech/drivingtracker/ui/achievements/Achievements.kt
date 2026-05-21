package com.omnitech.drivingtracker.ui.achievements

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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBackIosNew
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Settings
import androidx.compose.ui.res.painterResource
import androidx.lifecycle.viewmodel.compose.viewModel
import com.omnitech.drivingtracker.R
import com.omnitech.drivingtracker.ui.components.BadgeSection
import com.omnitech.drivingtracker.ui.components.RankCard
import com.omnitech.drivingtracker.ui.components.ScoreCard
import com.omnitech.drivingtracker.ui.components.TopBar
import com.omnitech.drivingtracker.ui.home.Dashboard


import androidx.navigation.NavController

@Composable
fun AchievemtsScreen(
    navController: NavController? = null,
    //Compose will automatically find and create a viewmodel
    viewModel: AchievementsViewModel = viewModel()
) {

    val ranks = viewModel.rankList //taking list from Viewmodel

    Scaffold(

        topBar = {
            TopBar(
                leftIcon = Icons.Default.ArrowBackIosNew,
                rightIcon = Icons.Default.Settings,
                onLeftClick = {/*Open menu*/},
                onRightClick = {/*Open settings*/}
            )
        },

        bottomBar = {
            BottomNavBar(navController = navController, color = "ach")
        }
    ) { innerPadding ->

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp, vertical = 24.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            item {
                //Overal Driving score
                ScoreCard(score = 85)
            }

            item {
                // Badges Gallery (LazyRow)
                BadgeSection()
            }

            item {
                Text(
                    text = "Ranks",
                    style = MaterialTheme.typography.titleMedium
                )
            }

            items(ranks) { person ->
                RankCard(
                    name = person.name,
                    score = person.score,
                    isUser = person.name == "You"
                )
                HorizontalDivider() //Thin line between rows
            }

        }

    }
}

@Preview(showBackground=true)
@Composable
fun AchievementsPreview(){
    DrivingTrackerTheme{
        AchievemtsScreen()
    }
}