package com.omnitech.drivingtracker.ui.other
import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import com.omnitech.drivingtracker.ui.components.TopBar
import androidx.compose.material3.Scaffold
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Settings
import androidx.navigation.NavController
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.foundation.layout.Row
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.padding
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.ui.Alignment
import androidx.navigation.compose.rememberNavController
import androidx.compose.material3.HorizontalDivider
import androidx.compose.ui.graphics.Color
import android.R.attr

@Composable
fun More(navController: NavController){
    Scaffold(

        topBar = {TopBar(
            leftIcon = Icons.AutoMirrored.Filled.ArrowBack,
            rightIcon = Icons.Default.Settings,
            onLeftClick = {navController?.popBackStack()},
            onRightClick = {/*Go to settings*/},
        )}
    ){
        innerPadding ->
            Column(
                modifier = Modifier.padding(innerPadding)
            ){
                ContentCard("Weekly Challenges"){navController.navigate("WeeklyChallenges")}
                HLine()
                ContentCard("OBD"){navController.navigate("OBDMain")}
                HLine()
                ContentCard("Vehicles"){navController.navigate("Vehicles")}
                HLine()
                ContentCard("Notifications"){navController.navigate("Notifications")}
                HLine()
                ContentCard("Profile"){navController.navigate("Profile")}
                HLine()
                ContentCard("Help"){navController.navigate("Help")}
            }

    }

}

@Composable
fun ContentCard(name: String, onClick:()->Unit){
    Card(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ){
        Row(
            modifier = Modifier.fillMaxWidth().clickable(onClick = onClick).padding(horizontal = 16.dp, vertical = 20.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ){
            Text(
                text = name,
                style = MaterialTheme.typography.bodyLarge
            )
        }
    }
}

@Composable
fun HLine(){
    HorizontalDivider(
        thickness = 1.dp,
        color = Color.Gray
    )
}

@Preview(showBackground = true)
@Composable
fun MorePreview(){
    DrivingTrackerTheme{
        More(navController = rememberNavController())
    }
}