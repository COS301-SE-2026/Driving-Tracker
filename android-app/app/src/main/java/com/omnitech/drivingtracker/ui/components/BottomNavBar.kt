package com.omnitech.drivingtracker.ui.components


import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.sp
import com.omnitech.drivingtracker.R
import com.omnitech.drivingtracker.ui.theme.Blue

import androidx.navigation.NavController
import com.omnitech.drivingtracker.Screen

@Composable
fun BottomNavBar(navController: NavController? = null, color: String = "") {

    NavigationBar {
        //Home Item
        NavigationBarItem(
            icon = {
                Icon(
                    painter = painterResource(id = R.drawable.ic_nav_home),
                    contentDescription = "Home",
                    tint = if (color == "home") Blue else Color.Gray
                )
            },
            label = { Text(
                text = "Home",
                color = if (color == "home") Blue else Color.Gray
            ) },
            selected = false,
            onClick = { navController?.navigate(Screen.Dashboard.route) }
        )

        //Trips Item
        NavigationBarItem(
            icon = {
                Icon(
                    painter = painterResource(id = R.drawable.ic_nav_road),
                    contentDescription = "Trips",
                    tint = if (color == "trip") Blue else Color.Gray
                )
            },
            label = { Text(text = "Trips", color = if (color == "trip") Blue else Color.Gray) },
            selected = false,
            onClick = { navController?.navigate(Screen.Trips.route) }
        )

        //Achievements Item
        NavigationBarItem(
            icon = {
                Icon(
                    painter = painterResource(id = R.drawable.ic_nav_starfilled),
                    contentDescription = "Achievements",
                    tint = if (color == "ach") Blue else Color.Gray
                )
            },
            label = {
                Text(
                    text = "Achievements",
                    fontSize = 10.sp,
                    color = if (color == "ach") Blue else Color.Gray
                )
            },
            selected = false,
            onClick = { navController?.navigate(Screen.Achievements.route) }
        )

        //Alerts Item
        NavigationBarItem(
            icon = {
                Icon(
                    painter = painterResource(id = R.drawable.ic_nav_bell),
                    contentDescription = "Alerts",
                    tint = if (color == "al") Blue else Color.Gray
                )
            },
            label = {
                Text(
                    text = "Alerts",
                    color = if (color == "al") Blue else Color.Gray
                )
            },
            selected = false,
            onClick = { /*Navigates to alerts*/ }
        )

        //More Item
        NavigationBarItem(
            icon = {
                Icon(
                    painter = painterResource(id = R.drawable.ic_nav_menu),
                    contentDescription = "More"
                )
            },
            label = { Text(text = "More") },
            selected = false,
            onClick = { navController?.navigate(Screen.WeeklyChallenges.route) }
        )
    }

}
