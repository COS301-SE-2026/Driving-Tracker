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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.shape.*
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Phone
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.runtime.*
import androidx.compose.material.icons.filled.AlternateEmail
import androidx.compose.material.icons.filled.Badge
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.EditNote
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import coil.compose.AsyncImage
import com.omnitech.drivingtracker.ui.components.ImagePickerSheet
import androidx.compose.foundation.lazy.items

data class Badge(val name: String, val icon: ImageVector)
@Composable
fun Profile(navController: NavController? = null) {

    var showImagePicker by remember { mutableStateOf(false) }
    var profileImageUri by remember { mutableStateOf<String?>(null) }

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
                ProfileHeader(name = "John Doe", profilePicture = Icons.Default.Person, onEditClick = {showImagePicker = true}, imageUri = profileImageUri)
            }
            item {
                //Account Information
                Spacer(modifier = Modifier.width(20.dp))

                AccountInformation(
                    fullName = "John Doe",
                    username = "JohnnyBoy123",
                    email = "JohnD@gmail.com",
                    phoneNumber = "081 854 0565"
                )
            }
            item {
                //App Activity
                AppActivity(
                    vehicleImageUris = listOf(),
                    badges = listOf(Badge("First Trip",Icons.Default.History),
                        Badge("Safe Driver", Icons.Default.VerifiedUser)),
                    tripCount = 12
                )
            }
            item {
                //Delete Account (remember to confirm and ask if user is sure)
                DeleteAccount(onClick = {})
            }
        }
    }
    //Image Picker Logic
    if (showImagePicker) {

        ImagePickerSheet(
            onImageSelected = { uri ->
                profileImageUri = uri.toString()
                showImagePicker = false
            },
            onDismiss = {
                showImagePicker = false
            }
        )

    }
}

@Composable
fun ProfileHeader(name: String, profilePicture: ImageVector,onEditClick: () -> Unit = {}, imageUri:String?=null) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(modifier = Modifier.size(100.dp))
        {
            Box(
                modifier = Modifier
                    .size(100.dp)
                    .background(Color(0xFFE3D9FA), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                if (imageUri != null){ //Coil for loading pictures/Uri's
                    AsyncImage(
                        model = imageUri,
                        contentDescription = "Profile picture",
                        modifier = Modifier
                            .size(100.dp)
                            .clip(CircleShape),
                        contentScale = ContentScale.Crop
                    )
                }
                else{
                    Icon(
                        imageVector = profilePicture,
                        contentDescription = "Profile picture",
                        modifier = Modifier.size(56.dp),
                        tint = Color(0xFF4B2E83)
                    )
                }
            }
            //Edit Icon
            Box(
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .size(20.dp)
                    .background(MaterialTheme.colorScheme.primary, CircleShape)
                    .clickable(onClick = onEditClick),
                contentAlignment = Alignment.Center
            ){
                Icon(
                    imageVector = Icons.Default.Edit,
                    contentDescription = "Edit profile picture",
                    modifier = Modifier.size(16.dp),
                    tint = Color.White
                )
            }
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

            Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary,modifier = Modifier.size(36.dp))

            Spacer(modifier = Modifier.width(12.dp))
            Column{
                Text(text = label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(text = value, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Medium)

            }
        }
        //Icon(Icons.Default.EditNote, contentDescription = null)
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

    /*ExpandableSection(
        title = "Account Information",
        expanded = expanded,
        onToggleExpanded = {expanded = ! expanded}
    ) {*/
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ){

        Text(
            text = "Account Information",
            style = MaterialTheme.typography.titleMedium,
            modifier = Modifier.padding(vertical = 8.dp)
        )
        
        Icon(Icons.Default.EditNote, contentDescription = null, modifier = Modifier.clickable{})

    }
    AccountInfoRow(icon = Icons.Default.Badge, label = "Full Name", value = fullName, onClick = {})
    AccountInfoRow(icon = Icons.Default.AlternateEmail, label = "Username", value = username, onClick = {})
    AccountInfoRow(icon = Icons.Default.Email, label = "Email", value = email, onClick = {})
    AccountInfoRow(icon = Icons.Default.Phone, label = "Phone Number", value = phoneNumber, onClick = {})
    //}
}

@Composable
fun AppActivity(
    vehicleImageUris: List<String>,
    badges: List<Badge>,
    tripCount: Int
){

    var expanded by remember {mutableStateOf(true)}

    ExpandableSection(
        title = "App Activity",
        expanded = expanded,
        onToggleExpanded = {expanded = ! expanded}
    ) {
        TripCountRow(count = tripCount)
        VehicleImagesRow(imageUris = vehicleImageUris)
        BadgesRow(badges = badges)
    }
}

@Composable
fun TripCountRow(count: Int){
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ){
        /*Icon(
            imageVector = Icons.Default.History,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(36.dp)
        )*/
        //Spacer(modifier = Modifier.width(12.dp))

        Column{
            Text(text = "Trips Completed", style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(text = count.toString(), style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Medium,color = MaterialTheme.colorScheme.tertiary)
        }
    }
}

@Composable
fun VehicleImagesRow(imageUris: List<String>){
    Column{
        Text(
            text = "My Vehicles",
            style = MaterialTheme.typography.titleSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(8.dp))
        LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)){
            items(imageUris){
                uri ->
                AsyncImage(
                    model = uri,
                    contentDescription = "Vehicle image",
                    modifier = Modifier.size(72.dp).clip(RoundedCornerShape(12.dp)),
                    contentScale = ContentScale.Crop
                )
            }
        }
    }
}
@Composable
fun BadgesRow(badges: List<Badge>){
    Column(

    ){
        Text(
            text = "Badges Earned",
            style = MaterialTheme.typography.titleSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(8.dp))
        LazyRow(horizontalArrangement = Arrangement.spacedBy(16.dp)){
            items(badges){
                badge ->
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally
                ){
                    Box(
                        modifier = Modifier.size(56.dp)
                            .background(color = MaterialTheme.colorScheme.primaryContainer),
                        contentAlignment = Alignment.Center
                    ){
                        Icon(
                            imageVector = badge.icon,
                            contentDescription = badge.name,
                            tint = MaterialTheme.colorScheme.primary
                        )
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    //Text(text = badge.name, style = MaterialTheme.typography.labelSmall)
                }
            }
        }
    }
}

@Composable
fun AppActivityCard(activity : String){
    Card(

    ){
        Row(
            verticalAlignment = Alignment.CenterVertically
        ){

            Icon(Icons.Default.History, contentDescription = null, tint = MaterialTheme.colorScheme.primary,modifier = Modifier.size(36.dp))

            Spacer(modifier = Modifier.width(12.dp))

            Text(text = activity, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Medium)

        }
    }
}

@Composable
fun DeleteAccount(onClick: () -> Unit){
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ){
        Text(
            text = "Delete Account",
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.error
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