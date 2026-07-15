package com.omnitech.drivingtracker.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
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
    CONTACT_REQUEST,
    REQUEST_ACCEPTED,
    BADGE_EARNED
}

data class NotificationItem(
    val id: String,
    val type: NotificationType,
    val name: String = "",
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
        colors = CardDefaults.cardColors(contentColor = CardWhite),
        border = BorderStroke(1.dp, Color.LightGray.copy(alpha = 0.5f))
    ) {
        Column(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth()
        ) {
            //Conditional statement to display type of notification
            when (notification.type) {
                NotificationType.CONTACT_REQUEST -> {
                    ContactRequestCardContent(notification.name, onAccept, onIgnore)
                }
                NotificationType.REQUEST_ACCEPTED -> {
                    Text(
                        text = "${notification.name} accepted your trusted contact request",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.Black
                    )
                }
                NotificationType.BADGE_EARNED -> {
                    Text(
                        text = "Congratulations! You just earned a ${notification.badgeName} badge 🎊",
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



}