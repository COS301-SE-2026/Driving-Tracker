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
import androidx.compose.material3.MaterialTheme
import androidx.compose.ui.Alignment
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.res.painterResource
import com.omnitech.drivingtracker.R
import com.omnitech.drivingtracker.ui.theme.*

@Composable
//This function displays the stat box on the dashboard (the grid of 4)
fun StatCard(label: String, value: Int, unit: String = "", icon: Painter, percentage: Int, modifier: Modifier = Modifier, tint: Color, onClick: ()-> Unit) {

    Card(
        onClick = onClick,
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = CardWhite),
        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(start = 16.dp, end = 16.dp, top = 12.dp, bottom = 4.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ){


            Row(
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {//for the icon and label
                Icon(painter = icon, contentDescription = "Icon on stats card", tint = tint)

                Text(
                    text = label,
                    fontSize = 14.sp,
                    style = MaterialTheme.typography.bodyMedium
                )
            }


            //for the value + unit
            Text(
                text = "$value $unit",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold
            )



            //for the  increase
            if (percentage > 0) {
                //positive change
                Text(
                    text = "+$percentage%",
                    color = Green,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    modifier = Modifier
                        .align(Alignment.End) //pushes text to the right
                        .padding(bottom = 8.dp)
                )

            } else if (percentage < 0) {
                //negative change
                Text(
                    text = "$percentage%",
                    color = Error,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    modifier = Modifier
                        .align(Alignment.End) //pushes text to the right
                        .padding(bottom = 8.dp)
                )
            }

        }
    }

}