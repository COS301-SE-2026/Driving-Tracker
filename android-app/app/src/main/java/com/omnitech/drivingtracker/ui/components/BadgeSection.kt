package com.omnitech.drivingtracker.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.*
import com.omnitech.drivingtracker.R
import com.omnitech.drivingtracker.ui.achievements.BadgeUiModel
import com.omnitech.drivingtracker.ui.theme.Blue
import com.omnitech.drivingtracker.ui.theme.CardWhite
import com.omnitech.drivingtracker.ui.theme.Green
import com.omnitech.drivingtracker.ui.theme.Purple

@Composable
//This function is the bar with your badges, user can scroll sideways to see more
fun BadgeSection(
    badges: List<BadgeUiModel>,
    onViewMore: () -> Unit,
    onBadgeClick: (BadgeUiModel) -> Unit
) {

    Column {

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {

            Text(
                "Your Badges",
                style = MaterialTheme.typography.titleMedium
            )

            Text(
                "View more",
                style = MaterialTheme.typography.bodyMedium,
                color = Blue,
                modifier = Modifier.clickable { onViewMore() }
            )

        }

        Spacer(modifier = Modifier.height(8.dp))

        //Grey bar holding the icons
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            color = CardWhite,
            shadowElevation = 8.dp
        ) {

            Row(
                modifier = Modifier.padding(16.dp),
                horizontalArrangement = Arrangement.SpaceAround
            ) {
                badges.take(5).forEach { badge ->
                    IconButton(onClick = { onBadgeClick(badge) }) {
                        Icon(
                            painter = painterResource(id = badge.iconRes),
                            contentDescription = badge.name,
                            tint = if (badge.isEarned) getBadgeColor(badge.category) else Color.Gray,
                            modifier = Modifier.size(32.dp)
                        )
                    }
                }
            }

        }

    }

}

fun getBadgeColor(category: String): Color = when (category.uppercase()) {
    "SAFETY" -> Green
    "MILESTONE" -> Purple
    else -> Blue
}