package com.omnitech.drivingtracker.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// Set of Material typography styles to start with
val AppTypography = Typography(
    displayLarge = TextStyle(
        fontWeight = FontWeight.Bold,
        fontSize = 40.sp,
        //color = TextPrimary
    ),
    //section titles
    headlineMedium = TextStyle(
        fontWeight = FontWeight.SemiBold,
        fontSize = 20.sp,
        //color = TextPrimary
    ),
    //sub-headings
    titleMedium = TextStyle(
        fontWeight = FontWeight.SemiBold,
        fontSize = 18.sp,
        //color = TextPrimary
    ),
    //Body
    bodyLarge = TextStyle(
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        //color = TextSecondary
    ),
    bodyMedium = TextStyle(
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        //color = TextSecondary
    ),
    labelSmall = TextStyle(
        fontWeight = FontWeight.Normal,
        fontSize = 12.sp,
        letterSpacing = 0.5.sp,
        //color = TextMuted
    )
)