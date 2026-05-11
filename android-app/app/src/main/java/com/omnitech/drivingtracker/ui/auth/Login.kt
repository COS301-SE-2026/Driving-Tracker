package com.omnitech.drivingtracker.ui.auth

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.unit.dp
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.omnitech.drivingtracker.ui.theme
import androidx.compose.ui.graphics.PaintingStyle.Companion.Stroke

@Composable
Column(
    modifier = Modifier.fillMaxSize(),
    horizontalAlignment = Alignment.CenterHorizontally
    verticalArrangement = Arrangement.Center
) {
    Card {
        Column (
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            //Email
            OutlinedTextField(
                value="",
                paceholder = {Text("Email", color=TextSecondary)}
            )
            //Password
            OutlinedTextField(
                value="",
                paceholder = {Text("Password", color=TextSecondary)}
            )

            //Button
            Button(
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Login")
            }

            //Forgot password
            Text("Forgot Password?")

        }
    }
}