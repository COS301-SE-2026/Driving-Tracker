package com.omnitech.drivingtracker.ui.components

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
import com.omnitech.drivingtracker.ui.theme.Blue
import com.omnitech.drivingtracker.ui.theme.CardWhite
import com.omnitech.drivingtracker.ui.theme.Green
import com.omnitech.drivingtracker.ui.theme.Purple

@Composable
//This function is the bar with your badges, user can scroll sideways to see more
fun BadgeSection() {

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

//            Text(
//                "View more",
//                style = MaterialTheme.typography.bodyMedium,
//                color = Blue
//            )

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
                Icon(painterResource(id = R.drawable.badge_01), null, tint = Purple)
                Icon(painterResource(id = R.drawable.badge_02), null, tint = Green)
                Icon(painterResource(id = R.drawable.badge_03), null, tint = Green)
                Icon(painterResource(id = R.drawable.badge_04), null, tint = Purple)
                Icon(painterResource(id = R.drawable.badge_05), null, tint = Purple)
            }

        }

    }

}