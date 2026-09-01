package com.omnitech.drivingtracker.ui.components

import androidx.compose.foundation.background
import androidx.compose.runtime.Composable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.*
import com.omnitech.drivingtracker.R
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountCircle
import com.omnitech.drivingtracker.ui.theme.*

@Composable
fun RankCard(name: String, score: Double, isUser: Boolean = false, compact: Boolean = false) {

    //Adjusting sizes based on compactness
    val verticalPadding = if (compact) 4.dp else 12.dp
    val horizontalPadding = if (compact) 0.dp else 16.dp
    val iconSize = if (compact) 24.dp else 40.dp
    val textStyle = if (compact) MaterialTheme.typography.bodyMedium else MaterialTheme.typography.bodyLarge

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(if (isUser && !compact) Color(0xFFF5F5F5) else Color.Transparent)
            .padding(vertical = verticalPadding, horizontal = horizontalPadding),
        verticalAlignment = Alignment.CenterVertically
    ) {

        Icon(
            imageVector = Icons.Default.AccountCircle, //Placeholder icon
            contentDescription = null,
            modifier = Modifier.size(40.dp),
            tint = if (isUser) Blue else Color.Gray //Highlighting user in compact mode
        )

        Spacer(modifier = Modifier.width(if (compact) 8.dp else 16.dp))

        //weight(1f) pushes everything after it to the end of the row
        Text(
            text = if(isUser){"You"} else {name},
            modifier = Modifier.weight(1f),
            style = textStyle,
            fontWeight = if (isUser) FontWeight.Bold else FontWeight.Normal
        )

        Text(
            text = "${score.toInt()}",
            fontWeight = FontWeight.Bold,
            style = textStyle
        )

    }

}