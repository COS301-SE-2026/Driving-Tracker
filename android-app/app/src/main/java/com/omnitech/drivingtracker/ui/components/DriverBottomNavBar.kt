package com.omnitech.drivingtracker.ui.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.omnitech.drivingtracker.R
import com.omnitech.drivingtracker.Screen
import com.omnitech.drivingtracker.ui.theme.Blue

@Composable
fun DriverBottomNavBar(navController: NavController? = null, color: String = "") {

    Column {
        HorizontalDivider(
            modifier = Modifier.fillMaxWidth(),
            thickness = 1.dp,
            color = MaterialTheme.colorScheme.outlineVariant.copy(0.5f)
        )
        NavigationBar(containerColor = Color.Transparent) {
            NavigationBarItem(
                icon = {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_nav_home),
                        contentDescription = "Home",
                        tint = if (color == "home") Blue else Color.Gray
                    )
                },
                label = { Text(text = "Home", color = if (color == "home") Blue else Color.Gray) },
                selected = color == "home",
                onClick = { navController?.navigate(Screen.DriverDashboard.route) }
            )

            //Scheduled Trips
            NavigationBarItem(
                icon = {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_nav_road),
                        contentDescription = "Scheduled Trips",
                        tint = if (color == "trip") Blue else Color.Gray
                    )
                },
                label = { Text(text = "Trips", color = if (color == "trip") Blue else Color.Gray) },
                selected = color == "trip",
                onClick = {
                    navController?.navigate(Screen.DriverTrips.route) {
                        popUpTo(Screen.DriverDashboard.route) { inclusive = false }
                    }
                }
            )

            NavigationBarItem(
                icon = {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_nav_obd),
                        contentDescription = "OBD",
                        tint = if (color == "obd") Blue else Color.Gray
                    )
                },
                label = { Text(text = "OBD", color = if (color == "obd") Blue else Color.Gray) },
                selected = color == "obd",
                onClick = {
                    navController?.navigate(Screen.OBDMain.route) {
                        popUpTo(Screen.DriverDashboard.route) { inclusive = false }
                    }
                }
            )

            //More
            NavigationBarItem(
                icon = {
                    Icon(
                        imageVector = Icons.Default.Menu,
                        contentDescription = "More",
                        tint = if (color == "more") Blue else Color.Gray
                    )
                },
                label = { Text(text = "More", color = if (color == "more") Blue else Color.Gray) },
                selected = color == "more",
                onClick = {
                    navController?.navigate(Screen.DriverMore.route) {
                        popUpTo(Screen.DriverDashboard.route) { inclusive = false }
                    }
                }
            )
        }
    }

}