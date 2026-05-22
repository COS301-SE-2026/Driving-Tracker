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

@Composable
fun RankCard(name: String, score: Double, isUser: Boolean = false) {

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(if (isUser) Color(0xFFF5F5F5) else Color.Transparent)
            .padding(vertical = 12.dp, horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {

        Icon(
            imageVector = Icons.Default.AccountCircle, //Placeholder icon
            contentDescription = null,
            modifier = Modifier.size(40.dp)
        )

        Spacer(modifier = Modifier.width(16.dp))

        //weight(1f) pushes everything after it to the end of the row
        Text(
            text = name,
            modifier = Modifier.weight(1f),
            style = MaterialTheme.typography.bodyLarge
        )

        Text(
            text = "$score",
            fontWeight = FontWeight.Bold
        )

    }

}