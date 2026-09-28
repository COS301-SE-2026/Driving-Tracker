package com.omnitech.drivingtracker.ui.driver

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.omnitech.drivingtracker.Screen
import com.omnitech.drivingtracker.ui.auth.AuthViewModel
import com.omnitech.drivingtracker.ui.components.DriverBottomNavBar
import com.omnitech.drivingtracker.ui.components.TopBar
import com.omnitech.drivingtracker.ui.other.CRow
import com.omnitech.drivingtracker.ui.other.ContentCard

@Composable
fun DriverMore(
    navController: NavController? = null,
    authViewModel: AuthViewModel = hiltViewModel()
) {
    Scaffold(
        topBar = {
            TopBar(
                leftIcon = Icons.AutoMirrored.Filled.ArrowBack,
                rightIcon = Icons.Default.Settings,
                onLeftClick = { navController?.popBackStack() },
                onRightClick = { navController?.navigate(Screen.Settings.route) }
            )
        },
        bottomBar = { DriverBottomNavBar(navController = navController, color = "more") }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(bottom = 16.dp)
        ) {
            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = "Vehicle & OBD",
                modifier = Modifier.padding(horizontal = 32.dp, vertical = 8.dp),
                style = MaterialTheme.typography.headlineMedium,
                color = Color.Black
            )

            ContentCard {
                CRow(label = "OBD Diagnostics", icon = Icons.Default.BluetoothDrive) {
                    navController?.navigate(Screen.OBDMain.route)
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            ContentCard {
                CRow(label = "Assigned Vehicles", icon = Icons.Default.DirectionsCar) {
                    navController?.navigate(Screen.Vehicles.route)
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            Text(
                text = "Account",
                modifier = Modifier.padding(horizontal = 32.dp, vertical = 8.dp),
                style = MaterialTheme.typography.headlineMedium,
                color = Color.Black
            )

            ContentCard {
                CRow(label = "Profile", icon = Icons.Default.CardMembership) {
                    navController?.navigate(Screen.Profile.route)
                }
            }


            Spacer(modifier = Modifier.height(10.dp))

            ContentCard {
                CRow(label = "Alerts & Notifications", icon = Icons.Default.Doorbell) {
                    navController?.navigate(Screen.Notifications.route)
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            Text(
                text = "Support",
                modifier = Modifier.padding(horizontal = 32.dp, vertical = 8.dp),
                style = MaterialTheme.typography.headlineMedium,
                color = Color.Black
            )

            ContentCard {
                CRow(label = "Help & Support", icon = Icons.Default.QuestionMark) {
                    navController?.navigate(Screen.Help.route)
                }
            }
        }
    }
}