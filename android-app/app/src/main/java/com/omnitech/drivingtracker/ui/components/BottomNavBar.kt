package com.omnitech.drivingtracker.ui.components


import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.res.painterResource
import com.omnitech.drivingtracker.R

import androidx.navigation.NavController
import com.omnitech.drivingtracker.Screen

@Composable
fun BottomNavBar(navController: NavController? = null) {

    NavigationBar {
        //Home Item
        NavigationBarItem(
            icon = {
                Icon(
                    painter = painterResource(id = R.drawable.ic_nav_home),
                    contentDescription = "Home"
                )
            },
            label = { Text("Home") },
            selected = false,
            onClick = { navController?.navigate(Screen.Dashboard.route) }
        )

        //Trips Item
        NavigationBarItem(
            icon = {
                Icon(
                    painter = painterResource(id = R.drawable.ic_nav_road),
                    contentDescription = "Trips"
                )
            },
            label = { Text("Trips") },
            selected = false,
            onClick = { navController?.navigate(Screen.Trips.route) }
        )

        //Achievements Item
        NavigationBarItem(
            icon = {
                Icon(
                    painter = painterResource(id = R.drawable.ic_nav_starfilled),
                    contentDescription = "Achieve"
                )
            },
            label = { Text("Achieve") },
            selected = false,
            onClick = { navController?.navigate(Screen.Achievements.route) }
        )

        //Alerts Item
        NavigationBarItem(
            icon = {
                Icon(
                    painter = painterResource(id = R.drawable.ic_nav_bell),
                    contentDescription = "Alerts"
                )
            },
            label = { Text("Alerts") },
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
            label = { Text("More") },
            selected = false,
            onClick = { navController?.navigate(Screen.Contacts.route) }
        )
    }

}
