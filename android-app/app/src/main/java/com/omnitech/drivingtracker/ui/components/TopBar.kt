package com.omnitech.drivingtracker.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.*
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.*
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.omnitech.drivingtracker.ui.theme.*

@Composable
//Reusable top bar component which will take in an icon as a parameter
fun TopBar(leftIcon: ImageVector, rightIcon: ImageVector, onLeftClick: () -> Unit, onRightClick: () -> Unit, modifier: Modifier = Modifier) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ){
        //left button
        IconButton(onClick = onLeftClick) {
            Icon(
                imageVector = leftIcon,
                contentDescription = "Navigation action",
                tint = MaterialTheme.colorScheme.onBackground
            )
        }
        //Title
        Row{
            Text(
                text = "Driving ",
                style = MaterialTheme.typography.headlineMedium,
                color = Blue
            )
            Text(
                text = "Tracker",
                style = MaterialTheme.typography.headlineMedium,
                color = MaterialTheme.colorScheme.onBackground
            )
        }
        //Right button
        Icon(
            imageVector = rightIcon,
            contentDescription = "Settings",
            tint = MaterialTheme.colorScheme.onBackground
        )
    }
}