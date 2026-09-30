package com.omnitech.drivingtracker.ui.components


import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.sp
import com.omnitech.drivingtracker.R
import com.omnitech.drivingtracker.ui.theme.Blue
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.omnitech.drivingtracker.Screen
import com.omnitech.drivingtracker.data.local.SessionManagerEntryPoint
import dagger.hilt.android.EntryPointAccessors

@Composable
fun BottomNavBar(navController: NavController? = null, color: String = "") {

    val context = LocalContext.current
    val sessionManager = remember(context) {
        EntryPointAccessors.fromApplication(
            context.applicationContext,
            SessionManagerEntryPoint::class.java
        ).sessionManager()
    }

    if (sessionManager.isDriver()) {
        DriverBottomNavBar(navController = navController, color = color)
        return
    }

    Column {
        HorizontalDivider(
            modifier = Modifier.fillMaxWidth(),
            thickness = 1.dp,
            color = MaterialTheme.colorScheme.outlineVariant.copy(0.5f)
        )

        NavigationBar(
            containerColor = Color.Transparent
        ) {
            //Home Item
            NavigationBarItem(
                icon = {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_nav_home),
                        contentDescription = "Home",
                        tint = if (color == "home") Blue else Color.Gray
                    )
                },
                label = {
                    Text(
                        text = "Home",
                        color = if (color == "home") Blue else Color.Gray
                    )
                },
                selected = color == "home",
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
                selected = color == "trip",
                onClick = { navController?.navigate(Screen.Trips.route) }
            )

            //Achievements Item
            NavigationBarItem(
                icon = {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_nav_achievements),
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
                selected = color == "ach",
                onClick = { navController?.navigate(Screen.Achievements.route) }
            )


            //OBD Item
            NavigationBarItem(
                icon = {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_nav_obd),
                        contentDescription = "OBD",
                        tint = if (color == "obd") Blue else Color.Gray
                    )
                },
                label = {
                    Text(
                        text = "OBD",
                        color = if (color == "obd") Blue else Color.Gray
                    )
                },
                selected = color == "obd",
                onClick = { navController?.navigate(Screen.OBDMain.route) }
            )

            //more
            NavigationBarItem(
                icon = {
                    Icon(
                        imageVector = Icons.Default.Menu,
                        contentDescription = "More",
                        tint = if (color == "more") Blue else Color.Gray
                    )
                },
                label = {
                    Text(
                        text = "More",
                        color = if (color == "more") Blue else Color.Gray
                    )
                },
                selected = color == "more",
                onClick = { navController?.navigate(Screen.More.route) }
            )

        }
    }
}

