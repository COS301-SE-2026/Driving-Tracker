package com.omnitech.drivingtracker.ui.auth
import androidx.compose.foundation.background
import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.unit.dp
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.omnitech.drivingtracker.ui.theme.Green
import androidx.compose.ui.graphics.PaintingStyle.Companion.Stroke
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.MoreHoriz
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.AccountCircle

enum class ContactStatus{ON_TRIP, OFF_TRIP}
//contact class
data class Contact(
    val name: String,
    val relationship: String,
    val status: ContactStatus
)
@Composable
fun Contacts(){

    val contacts = listOf(
        Contact("John Doe", "Friend for 8 months", ContactStatus.ON_TRIP),
        Contact("Emma Doe", "Friend for 6 months", ContactStatus.OFF_TRIP),
        Contact("Sarah Kim", "Friend for 4 months", ContactStatus.OFF_TRIP),
        Contact("Eren Yeager", "Friend for 2 months", ContactStatus.ON_TRIP),
        Contact("Karabo Mokena", "Friend for 1 months", ContactStatus.OFF_TRIP),

    )

    Column(
        modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)
    ){
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ){
            Icon(
                imageVector = Icons.Default.ArrowBack,
                contentDescription = "Back",
                tint = MaterialTheme.colorScheme.onBackground
            )
            Row{
                Text(
                    text = "Driving ",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = MaterialTheme.colorScheme.onBackground
                )
                Text(
                    text = "Tracker",
                    fontWeight = FontWeight.Normal,
                    fontSize = 18.sp,
                    color = MaterialTheme.colorScheme.onBackground
                )
            }
            Icon(
                imageVector = Icons.Default.Settings,
                contentDescription = "Settings",
                tint = MaterialTheme.colorScheme.onBackground
            )
        }
        //Page title
        Text(
            text = "Contacts",
            fontWeight = FontWeight.Bold,
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.onBackground,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
        )

        //Contacts
        Column(
            modifier = Modifier.weight(1f).verticalScroll(rememberScrollState())
                .padding(horizontal=16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ){
            contacts.forEach {
                contact->ContactCard(contact=contact) //display contact card for each contact in the class
            }
            //Add contact button
            Spacer(modifier = Modifier.height(4.dp))
            OutlinedButton(
                onClick = {},
                shape = RoundedCornerShape(50),
                border = ButtonDefaults.outlinedButtonBorder,
            ){
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = "Add",
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.height(8.dp))
            }
            BottomNavBar()
        }
    }
}
@Composable
fun ContactCard(contact: Contact){
    val isOnTrip = contact.status ==  ContactStatus.ON_TRIP
    val statusColor = if (isOnTrip) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.outline
    val statusText = if (isOnTrip) "On Trip" else "Still"

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor=MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ){
        Column(modifier = Modifier.padding(12.dp)){
            //Name and Avatar
            Icon(
                imageVector = Icons.Default.AccountCircle,
                contentDescription = "Avatar",
                modifier = Modifier.size(40.dp),
                tint = MaterialTheme.colorScheme.outline
            )
            Spacer(modifier = Modifier.width(8.dp))
        }

        Column{
            Text(
                text = contact.name,
                fontWeight = FontWeight.SemiBold,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onBackground
            )
            Text(
                text = contact.relationship,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
    Spacer(modifier = Modifier.height(8.dp))

    //Activity
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ){
        Row(verticalAlignment = Alignment.CenterVertically){
            Box(
                modifier = Modifier.size(10.dp).background(statusColor, CircleShape)
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = statusText,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        Button(
            onClick = {},
            shape = RoundedCornerShape(50),
            colors = ButtonDefaults.buttonColors(containerColor=MaterialTheme.colorScheme.secondary, contentColor = Color.White),
            contentPadding = PaddingValues(horizontal=16.dp,vertical=6.dp),
            modifier = Modifier.height(34.dp)
        ){
            Text("See Activity", style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
fun BottomNavBar(){
    NavigationBar(
        containerColor = Color.White,
        tonalElevation = 4.dp
    ){
        NavigationBarItem(
            selected = true,
            onClick = {},
            icon = {Icon(Icons.Default.AccountCircle,contentDescription = "Home")},
            label = {Text("Home")}
        )
        NavigationBarItem(
            selected = false,
            onClick = {},
            icon = {Icon(Icons.Default.AccountCircle,contentDescription = "Trips")},
            label = {Text("Trips")}
        )
        NavigationBarItem(
            selected = false,
            onClick = {},
            icon = {Icon(Icons.Default.AccountCircle,contentDescription = "Achievements")},
            label = {Text("Achievements")}
        )
        NavigationBarItem(
            selected = false,
            onClick = {},
            icon = {Icon(Icons.Default.AccountCircle,contentDescription = "Alerts")},
            label = {Text("Alerts")}
        )
        NavigationBarItem(
            selected = false,
            onClick = {},
            icon = {Icon(Icons.Default.AccountCircle,contentDescription = "More")},
            label = {Text("More")}
        )
    }
}

@Preview(showBackground=true)
@Composable
fun ContactsPreview(){
    DrivingTrackerTheme{
        Contacts()
    }
}