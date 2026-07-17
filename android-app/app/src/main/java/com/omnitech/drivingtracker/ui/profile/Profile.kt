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
import androidx.compose.foundation.clickable
import androidx.compose.foundation.shape.*
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.Phone
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.runtime.*

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
                AccountInformation(
                    fullName = "John Doe",
                    username = "JohnnyBoy123",
                    email = "JohnD@gmail.com",
                    phoneNumber = "081 854 0565"
                )
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

@Composable
fun ExpandableSection(
    title: String,
    expanded: Boolean,
    onToggleExpanded: () -> Unit,
    content: @Composable () -> Unit
){
    Column{

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable(onClick = onToggleExpanded)
                .padding(vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ){
            Text (text = title, style = MaterialTheme.typography.titleMedium)
            Icon(
                imageVector = if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                contentDescription = if (expanded) "Collapse" else "Expand"
            )
        }
        if (expanded){
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)){
                content()
            }
        }
    }
}

@Composable
fun AccountInfoRow(
    icon: ImageVector,
    label: String,
    value: String,
    onClick: () -> Unit
){
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .background(color = MaterialTheme.colorScheme.background, shape = RoundedCornerShape(8.dp))
        .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ){
        Row(
            verticalAlignment = Alignment.CenterVertically
        ){

            Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary,modifier = Modifier.size(40.dp))

            Spacer(modifier = Modifier.width(12.dp))
            Column{
                Text(text = label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(text = label, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Medium)

            }
        }
        Icon(Icons.Default.KeyboardArrowRight, contentDescription = null)
    }
}

@Composable
fun AccountInformation(
    fullName: String,
    username: String,
    email: String,
    phoneNumber: String
){
    var expanded by remember { mutableStateOf(true) }

    ExpandableSection(
        title = "Account Information",
        expanded = expanded,
        onToggleExpanded = {expanded = ! expanded}
    ) {
        AccountInfoRow(icon = Icons.Default.Person, label = "Full Name", value = fullName, onClick = {})
        AccountInfoRow(icon = Icons.Default.Person, label = "Username", value = username, onClick = {})
        AccountInfoRow(icon = Icons.Default.Email, label = "Email", value = email, onClick = {})
        AccountInfoRow(icon = Icons.Default.Phone, label = "Phone Number", value = phoneNumber, onClick = {})
    }
}

@Preview(showBackground = true)
@Composable
fun ProfilePreview() {
    DrivingTrackerTheme {
        Profile()
    }
}