package com.omnitech.drivingtracker.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.border
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
import com.omnitech.drivingtracker.ui.theme.*
import org.checkerframework.common.value.qual.StringVal

@Composable
//This function displays the Overal driving score with progress bar
fun ScoreCard(score: Int, modifier: Modifier = Modifier) {

    var driverClassification: String

    fun driverClassificationFun(score: Int) : String{
        return if (score < 20){
            "Poor Driver"
        }
        else if (score < 70){
            "Average Driver"
        }
        else if (score < 80){
            "Good Driver"
        }
        else "Pro driver!"
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = CardWhite),
        elevation = CardDefaults.cardElevation(defaultElevation = 12.dp)
    ) {

        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {

            Text(
                text = "Overall Driving Score",
                modifier = Modifier.fillMaxWidth(),
                style = MaterialTheme.typography.bodyLarge
            )

            Spacer(modifier = Modifier.height(12.dp))

            Box(
                contentAlignment = Alignment.Center,
                //modifier = Modifier.weight(1f, fill = false)//so that box can dynamically change size
                modifier = Modifier.wrapContentSize()
            ) {

                CircularProgressIndicator(
                    progress = { score / 100f },
                    modifier = Modifier.size(130.dp),
                    strokeWidth = 12.dp,
                    color = Green,
                    trackColor = Gray
                )

                Column(
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "$score",
                        style = MaterialTheme.typography.displayLarge
                    )

                    Text(
                        text = driverClassificationFun(score),
                        style = MaterialTheme.typography.labelMedium
                    )
                }

            }

        }

    }
}
