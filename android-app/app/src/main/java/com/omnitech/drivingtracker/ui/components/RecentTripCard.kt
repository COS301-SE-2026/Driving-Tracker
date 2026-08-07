package com.omnitech.drivingtracker.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
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
import com.omnitech.drivingtracker.data.models.TripItemDto
import com.omnitech.drivingtracker.ui.theme.CardWhite
import com.omnitech.drivingtracker.ui.theme.*
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.time.ZoneId

@Composable
fun RecentTripCard(
    trip: TripItemDto,
    modifier: Modifier = Modifier,
    startLoc: String = "Last Trip",
    onClick: () -> Unit = {}
) {

    //extract data from DTO
    val distance = trip.distanceKm?.toInt() ?: 0
    val drivingTime = trip.durationMinutes ?: 0
    val startTime = trip.startTime
    val tripScore = trip.trip_scores?.firstOrNull()?.overallScore?.toInt() ?: 0
    val destination = trip.status

    //Formatting raw ISO date string
    val formattedDate = try  {
        val zdt = ZonedDateTime.parse(startTime).withZoneSameInstant(ZoneId.systemDefault())
        val formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy • HH:mm")
        zdt.format(formatter)
    } catch (e: Exception) {
        startTime // Fallback if parsing fails
    }

    Card(
        modifier = modifier.fillMaxWidth().clickable{ onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = CardWhite),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                modifier = Modifier.size(48.dp),
                shape = RoundedCornerShape(12.dp),
                color = Purple.copy(alpha = 0.1f)
            ) {
                //1. Trip Icon
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        painter = painterResource(id = R.drawable.badge_01),
                        contentDescription = "Trip route icon",
                        modifier = Modifier.size(28.dp),
                        tint = Purple
                    )
                }
            }

            Spacer(modifier = Modifier.width(12.dp))

                //2. Trip details
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = formattedDate,
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Normal,
                    color = Color.Gray
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {

                    //Locations
                    Column {
                        Text(
                            text = startLoc.replaceFirstChar { it.uppercase() },
                            style = MaterialTheme.typography.bodyLarge,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = destination.replaceFirstChar { it.uppercase() },
                            style = MaterialTheme.typography.bodyLarge,
                            fontWeight = FontWeight.SemiBold
                        )
                    }

                    //Distance and duration
                    Column(horizontalAlignment = Alignment.End) {

                        Text(
                            text = "$distance km",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Color.Gray
                        )
                        Text(
                            text = "$drivingTime min",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Color.Gray
                        )

                    }

                }

            }

            Spacer(modifier = Modifier.width(12.dp))

            //Score
            ScoreRing(
                score = tripScore,
                modifier = Modifier.size(48.dp)
            )

            }


    }

}