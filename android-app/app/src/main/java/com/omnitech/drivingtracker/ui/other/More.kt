package com.omnitech.drivingtracker.ui.other
import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import com.omnitech.drivingtracker.ui.components.TopBar
import com.omnitech.drivingtracker.ui.components.BottomNavBar
import androidx.compose.material3.Scaffold
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Settings
import androidx.navigation.NavController
import androidx.compose.foundation.layout.Column
@Composable
fun More(){
    Scaffold(

        topBar = {TopBar(
            leftIcon = Icons.AutoMirrored.Filled.ArrowBack,
            rightIcon = Icons.Default.Settings,
            onLeftClick = {navController?.popBackStack()},
            onRightClick = {/*Go to settings*/},
        )}
    ){
        {innerPadding ->
            Column(
                ContentCard("Weekly Challenges"){navController.navigate("WeeklyChallenges")}
                ContentCard("OBD"){navController.navigate("OBDMain")}
                ContentCard("Vehicles"){navController.navigate("Vehicles")}
                ContentCard("Notifications"){navController.navigate("Notifications")}
                ContentCard("Profile"){navController.navigate("Profile")}
                ContentCard("Help"){navController.navigate("Help")}
            )
        }
    }

}

@Preview(showBackground = true)
@Composable
fun MorePreview(){
    DrivingTrackerTheme{
        More()
    }
}