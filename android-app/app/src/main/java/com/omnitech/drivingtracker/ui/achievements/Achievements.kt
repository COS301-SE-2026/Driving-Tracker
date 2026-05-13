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
import com.omnitech.drivingtracker.ui.theme.Green
import androidx.compose.ui.graphics.PaintingStyle.Companion.Stroke
import com.omnitech.drivingtracker.ui.components.BottomNavBar
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.item
import androidx.compose.foundation.lazy.LazyRow


@Composable
fun AchievemtsScreen() {
    Scaffold(
        bottomBar = {
            BottomNavBar()
        }
    ) { innerPadding ->

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            item {
                //Overal Driving score
            }

            item {
                // Badges Gallery (LazyRow)
            }

            item {
                // other sections and so on
            }
        }

    }
}