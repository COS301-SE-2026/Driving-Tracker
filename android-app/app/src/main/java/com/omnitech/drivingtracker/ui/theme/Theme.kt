package com.omnitech.drivingtracker.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext
import com.omnitech.drivingtracker.ui.theme.TextSecondary
import androidx.compose.ui.graphics.Color



private val DarkColorScheme = darkColorScheme(
    primary = Blue,
    secondary = Green,
    tertiary = Purple,
    background = Background,
    surface = CardWhite,
    surfaceVariant = Color(0xFF1E2438),
    outline = Border,
    onPrimary = CardWhite,
    onSecondary = CardWhite,
    onBackground = TextPrimary,
    onSurface = TextPrimary,
    error = Error,
    onSurfaceVariant = TextSecondary
)

private val LightColorScheme = lightColorScheme(
    primary = Blue,
    secondary = Green,
    tertiary = Purple,
    background = Background,
    surface = CardWhite,
    surfaceVariant = Color(0xFFF0F4FF),
    outline = Border,
    onPrimary = CardWhite,
    onSecondary = CardWhite,
    onBackground = TextPrimary,
    onSurface = TextPrimary,
    error = Error,
    onSurfaceVariant = TextSecondary
)

@Composable
fun DrivingTrackerTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    // Dynamic color is available on Android 12+
    dynamicColor: Boolean = false, //so we dont use the phone's "mode" yet
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }

        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = AppTypography,
        content = content
    )
}