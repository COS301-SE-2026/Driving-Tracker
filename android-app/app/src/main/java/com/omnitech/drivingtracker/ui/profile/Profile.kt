package com.omnitech.drivingtracker.ui.profile

import androidx.compose.foundation.lazy.LazyColumn
import com.omnitech.drivingtracker.ui.components.YourTopBar
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Settings
import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import androidx.navigation.NavController
import com.omnitech.drivingtracker.Screen
import com.omnitech.drivingtracker.ui.components.BottomNavBar
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import androidx.compose.material3.*
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.filled.Person
import androidx.compose.ui.Alignment
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.background
import androidx.compose.foundation.shape.*
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight

@Composable
fun Profile(navController: NavController? = null) {
    Scaffold(
        topBar = {
            YourTopBar(
                leftIcon = Icons.AutoMirrored.Filled.ArrowBack,
                rightIcon = Icons.Default.Settings,
                leftWord = "Your ",
                rightWord = "Profile",
                showBottomBar = false,
                onLeftClick = { navController?.popBackStack() },
                onRightClick = { navController?.navigate(Screen.Settings.route) }
            )
        }

    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                ProfileHeader(name = "John Doe", profilePicture = Icons.Default.Person)
            }
            item {
                //Account Information
            }
            item {
                //App Activity
            }
            item {
                //Delete Account (remember to confirm and ask if user is sure)
            }
        }
    }
}

@Composable
fun ProfileHeader(name: String, profilePicture: ImageVector) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(100.dp)
                .background(Color(0xFFE3D9FA), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = profilePicture,
                contentDescription = "Profile picture",
                modifier = Modifier.size(56.dp),
                tint = Color(0xFF4B2E83)
            )
        }
        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = name,
            fontWeight = FontWeight.Bold,
            style = MaterialTheme.typography.titleMedium
        )
    }
}

@Preview(showBackground = true)
@Composable
fun ProfilePreview() {
    DrivingTrackerTheme {
        Profile()
    }
}