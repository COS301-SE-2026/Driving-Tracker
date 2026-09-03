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
import androidx.navigation.compose.rememberNavController
import androidx.compose.material3.HorizontalDivider
import androidx.compose.ui.graphics.Color
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material.icons.automirrored.filled.ArrowForwardIos
import com.omnitech.drivingtracker.Screen
import androidx.compose.foundation.shape.*
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.filled.AutoGraph
import androidx.compose.material.icons.filled.BluetoothDrive
import androidx.compose.material.icons.filled.CardMembership
import androidx.compose.material.icons.filled.Contacts
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.Doorbell
import androidx.compose.material.icons.filled.QuestionMark
import androidx.compose.material.icons.filled.VideogameAsset
import androidx.compose.ui.text.font.*
import androidx.compose.material3.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.graphics.vector.ImageVector
import com.omnitech.drivingtracker.ui.components.BottomNavBar
import com.omnitech.drivingtracker.ui.theme.CardWhite

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
                    .verticalScroll(rememberScrollState())
                    .padding(bottom = 16.dp)
            ){
                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    text = "Vehicle",
                    modifier = Modifier.padding(horizontal = 32.dp, vertical = 8.dp),
                    style = MaterialTheme.typography.headlineMedium,
                    color = Color.Black
                )
                ContentCard {
                    CRow(label = "OBD",
                        icon = Icons.Default.BluetoothDrive)
                    {
                        navController.navigate(Screen.OBDMain.route)
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                ContentCard {
                    CRow(label = "Vehicles",
                        icon = Icons.Default.DirectionsCar)
                    {
                        navController.navigate(Screen.Vehicles.route)
                    }
                }
                Spacer(modifier = Modifier.height(14.dp))
                Text(
                    text = "Personal",
                    modifier = Modifier.padding(horizontal = 32.dp, vertical = 8.dp),
                    style = MaterialTheme.typography.headlineMedium,
                    color = Color.Black
                )
                ContentCard {
                    CRow(label = "Profile",
                        icon = Icons.Default.CardMembership)
                    {
                        navController.navigate(Screen.Profile.route)
                    }
                }
                Spacer(modifier = Modifier.height(10.dp))
                ContentCard {
                    CRow(label = "Contacts",
                        icon = Icons.Default.Contacts)
                    {
                        navController.navigate(Screen.Contacts.route)
                    }
                }
                Spacer(modifier = Modifier.height(14.dp))
                Text(
                    text = "App Activity",
                    modifier = Modifier.padding(horizontal = 32.dp, vertical = 8.dp),
                    style = MaterialTheme.typography.headlineMedium,
                    color = Color.Black
                )
                ContentCard {
                    CRow(label = "Analytics",
                        icon = Icons.Default.AutoGraph)
                    {
                        navController.navigate(Screen.Analytics.route)
                    }
                }
                Spacer(modifier = Modifier.height(10.dp))
                ContentCard {
                    CRow(label = "Weekly Challenges",
                        icon = Icons.Default.VideogameAsset)
                    {
                        navController.navigate(Screen.WeeklyChallenges.route)
                    }
                }
                Spacer(modifier = Modifier.height(10.dp))
                ContentCard {
                    CRow(label = "Alerts",
                        icon = Icons.Default.Doorbell)
                    {
                        navController.navigate(Screen.Notifications.route)
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
                    CRow(label = "Help",
                        icon = Icons.Default.QuestionMark)
                    {
                        navController.navigate(Screen.Help.route)
                    }
                }
                Spacer(modifier = Modifier.height(14.dp))
                ContentCard {
                    CRow(label = "Fuel Comp",
                        icon = Icons.Default.QuestionMark)
                    {
                        navController.navigate(Screen.FuelComparison.route)
                    }
                }
            }

    }

}

@Composable
fun ContentCard(content: @Composable ColumnScope.() -> Unit){
    Card(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        colors = CardDefaults.cardColors(containerColor = CardWhite)
    ){
        Column{
            content()
        }
    }
}

@Composable
fun CRow(label: String, icon: ImageVector, onClick:()->Unit){
    Row(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 20.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ){
        Row(
            modifier = Modifier.fillMaxWidth()
            .clickable(onClick = onClick)
                .padding(horizontal = 16.dp, vertical = 18.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(20.dp),
                tint = MaterialTheme.colorScheme.primary
            )

            Spacer(modifier = Modifier.width(16.dp))

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