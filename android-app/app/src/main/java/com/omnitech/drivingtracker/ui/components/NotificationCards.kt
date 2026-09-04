package com.omnitech.drivingtracker.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.omnitech.drivingtracker.ui.theme.*

//This file contains component cards for notifications

enum class NotificationType {
    TRUSTED_CONTACT_REQUEST,
    TRUSTED_CONTACT_RESPONSE,
    BADGE_UNLOCKED,
    TRIP_SHARED,
    GENERAL,

    VIEW_SHARED_TRIP,

    TRIP_ALERT
}

data class NotificationItem(
    val id: String,
    val type: NotificationType,
    val name: String = "",
    val body: String = " ",
    val badgeName: String = "",
    val timestamp: String = ""
)

@Composable
fun NotificationCard(
    notification: NotificationItem,
    onAccept: () -> Unit = {},
    onIgnore: () -> Unit = {}
) {

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = CardWhite),
        border = BorderStroke(1.dp, Color.LightGray.copy(alpha = 0.5f))
    ) {
        Column(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth()
        ) {
            //Conditional statement to display type of notification
            when (notification.type) {
                NotificationType.TRUSTED_CONTACT_REQUEST -> {
                    ContactRequestCardContent(notification.name, onAccept, onIgnore)
                }
                NotificationType.TRUSTED_CONTACT_RESPONSE -> {
                    Text(
                        text = notification.body,
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.Black
                    )
                }
                NotificationType.BADGE_UNLOCKED -> {
                    Text(
                        text = " ${notification.body}🎊",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.Black
                    )
                }
                NotificationType.TRIP_SHARED -> {
                    Text(
                        text = notification.body,
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.Black
                    )
                }
                NotificationType.GENERAL -> {
                    Text(
                        text = notification.body,
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.Black
                    )
                }
                NotificationType.VIEW_SHARED_TRIP -> {
                    ViewSharedTripContent(notification.body, onAccept, onIgnore)
                }
                NotificationType.TRIP_ALERT -> {
                    Text(
                        text = notification.body,
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.Black
                    )
                }
            }
        }
    }

}

@Composable
private fun ContactRequestCardContent(
    name: String,
    onAccept: () -> Unit,
    onIgnore: () -> Unit
) {

    Column(modifier = Modifier.fillMaxWidth()) {

        Text(
            text = "$name wants you to be their trusted contact",
            style = MaterialTheme.typography.bodyMedium,
            color = Color.Black
        )

        Spacer(modifier = Modifier.height(8.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.End,
            verticalAlignment = Alignment.CenterVertically
        ) {
            //
            TextButton(
                onClick = onIgnore,
                contentPadding = PaddingValues(horizontal = 8.dp)
            ) {
                Text(
                    text = "Ignore",
                    color = Color.Gray,
                    fontSize = 14.sp
                )
            }

            Spacer(modifier = Modifier.width(8.dp))

            //Accept Button: Blue outline, blue text, same background as card
            OutlinedButton(
                onClick = onAccept,
                border = BorderStroke(1.dp, Blue),
                shape = RoundedCornerShape(20.dp),
                colors = ButtonDefaults.outlinedButtonColors(
                    containerColor = Color.Transparent,
                    contentColor = Blue
                ),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 0.dp),
                modifier = Modifier.height(32.dp)
            ) {
                Text(
                    text = "Accept",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium
                )
            }

        }

    }

}

@Composable
private fun ViewSharedTripContent(
    body: String,
    onAccept: () -> Unit,
    onIgnore: () -> Unit
) {

    Column(modifier = Modifier.fillMaxWidth()) {

        Text(
            text = body,
            style = MaterialTheme.typography.bodyMedium,
            color = Color.Black
        )

        Spacer(modifier = Modifier.height(8.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.End,
            verticalAlignment = Alignment.CenterVertically
        ) {
            //
//            TextButton(
//                onClick = onIgnore,
//                contentPadding = PaddingValues(horizontal = 8.dp)
//            ) {
//                Text(
//                    text = "Ignore",
//                    color = Color.Gray,
//                    fontSize = 14.sp
//                )
//            }

            Spacer(modifier = Modifier.width(8.dp))

            //Accept Button: Blue outline, blue text, same background as card
            OutlinedButton(
                onClick = onAccept,
                border = BorderStroke(1.dp, Blue),
                shape = RoundedCornerShape(20.dp),
                colors = ButtonDefaults.outlinedButtonColors(
                    containerColor = Color.Transparent,
                    contentColor = Blue
                ),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 0.dp),
                modifier = Modifier.height(32.dp)
            ) {
                Text(
                    text = "View",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium
                )
            }

        }

    }

}