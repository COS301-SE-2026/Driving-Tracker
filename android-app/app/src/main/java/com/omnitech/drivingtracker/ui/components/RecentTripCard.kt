package com.omnitech.drivingtracker.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.omnitech.drivingtracker.R

@Composable
fun RecentTripCard(startLoc: String, destination: String, distance: Int, drivingTime: Int, startTime: String, tripScore: Int, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFE0E0E0))
    ) {

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            //1. Trip Icon
            Icon(
                painter = painterResource(id = R.drawable.badge_01),
                contentDescription = "Trip route icon",
                modifier = Modifier.padding(end = 24.dp)
            )

            //2. Trip details
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = startTime,
                    fontSize = 14.sp,
                    color = Color.Gray
                )

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = startLoc,
                        fontWeight = FontWeight.Medium
                    )
                    Text(
                        text = "$distance km",
                        color = Color.Gray
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = destination,
                        fontWeight = FontWeight.Medium
                    )
                    Text(
                        text = "$drivingTime min",
                        color = Color.Gray
                    )
                }
            }
            //3. Score
            ScoreRing(score = tripScore, modifier = Modifier.size(48.dp))
        }
    }

}