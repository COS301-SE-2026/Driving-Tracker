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
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.automirrored.filled.ArrowForwardIos
import com.omnitech.drivingtracker.Screen
import androidx.compose.foundation.shape.*
import androidx.compose.ui.text.font.*
import androidx.compose.material3.*
import com.omnitech.drivingtracker.ui.components.BottomNavBar

@Composable
fun More(navController: NavController){
    Scaffold(

        topBar = {TopBar(
            leftIcon = Icons.AutoMirrored.Filled.ArrowBack,
            rightIcon = Icons.Default.Settings,
            onLeftClick = {navController?.popBackStack()},
            onRightClick = {navController.navigate(Screen.Settings.route)}
        )},
        bottomBar = {BottomNavBar(navController = navController, color = "more")}
    ){
        innerPadding ->
            Column(
                modifier = Modifier.padding(innerPadding)
            ){
//                Spacer(modifier = Modifier.height(25.dp))
//                ContentCard("Weekly Challenges"){navController.navigate(Screen.WeeklyChallenges.route)}
                Spacer(modifier = Modifier.height(25.dp))
                ContentCard("OBD"){navController.navigate(Screen.OBDMain.route)}
                Spacer(modifier = Modifier.height(25.dp))
                ContentCard("Vehicles"){navController.navigate(Screen.Vehicles.route)}
                Spacer(modifier = Modifier.height(25.dp))
                ContentCard("Contacts"){navController.navigate(Screen.Contacts.route)}
                Spacer(modifier = Modifier.height(25.dp))
                ContentCard("Alerts"){navController.navigate(Screen.Notifications.route)}
                Spacer(modifier = Modifier.height(25.dp))
                ContentCard("Profile"){navController.navigate(Screen.Profile.route)}
                Spacer(modifier = Modifier.height(25.dp))
                ContentCard("Help"){navController.navigate(Screen.Help.route)}
            }

    }

}

@Composable
fun ContentCard(name: String, onClick:()->Unit){
    Card(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ){
        Column{
            CRow(name, onClick)
        }
    }
}

@Composable
fun CRow(label: String, onClick:()->Unit){
    Row(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 20.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ){
        Text(
            text = label,
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.SemiBold
        )
        Icon(
            imageVector = Icons.AutoMirrored.Filled.ArrowForwardIos,
            contentDescription = null,
            modifier = Modifier.size(16.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
fun ColumnScope.HLine(){
    HorizontalDivider(
        modifier = Modifier.fillMaxWidth(0.85f).align(Alignment.CenterHorizontally),
        thickness = 2.dp,
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