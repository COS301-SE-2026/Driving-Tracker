package com.omnitech.drivingtracker.ui.components

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.unit.dp
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.compose.ui.graphics.PaintingStyle.Companion.Stroke
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.ui.Alignment
import com.omnitech.drivingtracker.ui.theme.Green

@Composable
//This function displays the Overal driving score with progress bar
fun ScoreRing(score: Int, modifier: Modifier = Modifier, rating: String) {

    Box(
        contentAlignment = Alignment.Center,
        modifier = modifier //so that you can decide size when you call the function
    ) {

        CircularProgressIndicator(
            progress = { score / 100f },
            strokeWidth = 8.dp,
            color = Color.Green,
            trackColor = Color.LightGray,
            modifier = Modifier.fillMaxSize()
        )

        Column(horizontalAlignment = Alignment.CenterHorizontally){
            Text(
                text = "$score",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = rating,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }

}

