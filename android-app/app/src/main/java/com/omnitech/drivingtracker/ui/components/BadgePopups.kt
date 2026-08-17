package com.omnitech.drivingtracker.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.unit.*
import androidx.compose.ui.graphics.*
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import com.omnitech.drivingtracker.ui.achievements.BadgeUiModel
import com.omnitech.drivingtracker.ui.theme.*

//the badge overlays
@Composable
fun BadgeGalleryDialog(
    badges: List<BadgeUiModel>,
    completedChallenges: Int,
    onDismiss: () -> Unit,
    onBadgeClick: (BadgeUiModel) -> Unit
) {

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = Color.White,
            border = BorderStroke(2.dp, Blue),
            modifier = Modifier.fillMaxWidth().padding(16.dp)
        ) {
            Column(modifier = Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    StatBox("Badges", "${badges.count { it.isEarned }}/${badges.size}", Modifier.weight(1f))
                    StatBox("Completed challenges", "$completedChallenges", Modifier.weight(1f))
                }
                Spacer(Modifier.height(24.dp))
                FlowRow(modifier = Modifier.padding(16.dp), mainAxisSpacing = 16.dp, crossAxisSpacing = 16.dp) {
                    badges.forEach { badges ->
                        BadgeIcon(badge, { onBadgeClick(badge) }, size = 48.dp)
                    }
                }
            }
        }
    }

}

@Composable
fun BadgeDescriptionDialog(badge: BadgeUiModel, onDismiss: () -> Unit) {
    val color = getBadgeColor(badge.category)
    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(16.dp), border = BorderStroke(2.dp, color),
            modifier = Modifier.fillMaxWidth().padding(16.dp)
        ) {
            Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.width(80.dp)) {
                    Icon(painterResource(badge.iconRes), null, tint = if (badge.isEarned) color else Color.Gray, modifier = Modifier.size(48.dp))
                    Text(badge.name, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                }
                Spacer(Modifier.width(16.dp))
                Text(badge.description, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
            }
        }
    }
}