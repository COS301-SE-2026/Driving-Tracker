package com.omnitech.drivingtracker.ui.profile

import android.app.AlertDialog
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.ui.Alignment
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import com.omnitech.drivingtracker.BuildConfig
import com.omnitech.drivingtracker.ui.auth.ProfileViewModel

@Composable
fun Profile(navController: NavController? = null,
            viewModel: ProfileViewModel = hiltViewModel()
) {

    val uiState by viewModel.uiState.collectAsState()
    val isUploadingPicture by viewModel.isUploadingPicture.collectAsState()
    val uploadError by viewModel.uploadError.collectAsState()

    var showImagePicker by remember { mutableStateOf(false) }
    var profileImageUri by remember { mutableStateOf<String?>(null) }

    Scaffold(
        topBar = {
            YourTopBar(
                leftIcon = Icons.AutoMirrored.Filled.ArrowBack,
                rightIcon = Icons.Default.Settings,
                leftWord = "Your ",
                rightWord = "Profile",
                onLeftClick = { navController?.popBackStack() },
                onRightClick = { navController?.navigate(Screen.Settings.route) }
            )
        }

    ) { paddingValues ->
        Box(modifier = Modifier.fillMaxSize().padding(paddingValues)){
            when(val state = uiState){
                is ProfileViewModel.UiState.Loading -> CircularProgressIndicator(Modifier.align(
                    Alignment.Center))
                is ProfileViewModel.UiState.Success -> {
                    val profile = state.profile
                    val profileImageUrl = profile.profilePictureUrl?.let{ BuildConfig.BASE_URL + it }
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        item {
                            ProfileHeader(name = "${profile.name} ${profile.surname}", profilePicture = Icons.Default.Person, onEditClick = {showImagePicker = true}, imageUri = profileImageUri, isUploading = isUploadingPicture)
                        }
                        item {
                            //Account Information
                            Spacer(modifier = Modifier.width(20.dp))

                            AccountInformation(
                                fullName = "${profile.name} ${profile.surname}",
                                username = profile.username,
                                email = profile.email,
                                phoneNumber = profile.phoneNumber
                            )
                        }
                        item {
                            //App Activity
                            AppActivity(
                                vehicleCount = profile.vehicleCount,
                                badgeCount = profile.badgeCount,
                                tripCount = profile.tripCount
                            )
                        }
                        item {
                            //Delete Account (remember to confirm and ask if user is sure)
                            DeleteAccount(onClick = {})
                        }
                    }
                }
                is ProfileViewModel.UiState.Error -> Text(state.message, color = Color.Red)
            }
        }
    }

    //Image Picker Logic
    if (showImagePicker) {

        ImagePickerSheet(
            onImageSelected = { uri ->
                viewModel.uploadProfilePicture(uri)
                showImagePicker = false
            },
            onDismiss = {
                showImagePicker = false
            }
        )

    }

    uploadError?.let{message ->
        AlertDialog(
            onDismissRequest = { viewModel.clearUploadError() },
            title = { Text("Upload failed") },
            text = { Text(message) },
            confirmButton = {
                TextButton(onClick = { viewModel.clearUploadError() }) { Text("OK") }
            }
        )
    }
}

@Composable
fun ProfileHeader(name: String, profilePicture: ImageVector,onEditClick: () -> Unit = {}, imageUri:String?=null, isUploading: Boolean  = false) {
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
                if(isUploading){
                    CircularProgressIndicator(modifier = Modifier.size(32.dp))
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
    }
}

@Composable
fun AccountInformation(
    fullName: String,
    username: String,
    email: String,
    phoneNumber: String
){
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
        
        //Icon(Icons.Default.EditNote, contentDescription = null, modifier = Modifier.clickable{})

    }
    AccountInfoRow(icon = Icons.Default.Badge, label = "Full Name", value = fullName, onClick = {})
    AccountInfoRow(icon = Icons.Default.AlternateEmail, label = "Username", value = username, onClick = {})
    AccountInfoRow(icon = Icons.Default.Email, label = "Email", value = email, onClick = {})
    AccountInfoRow(icon = Icons.Default.Phone, label = "Phone Number", value = phoneNumber, onClick = {})
    //}
}

@Composable
fun AppActivity(
    vehicleCount: Int,
    badgeCount: Int,
    tripCount: Int
){

    var expanded by remember {mutableStateOf(false)}

    ExpandableSection(
        title = "App Activity",
        expanded = expanded,
        onToggleExpanded = {expanded = ! expanded}
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ){
            StatCard(
                icon = Icons.Default.History,
                value = tripCount.toString(),
                label = "Trips",
                modifier = Modifier.weight(1f)
            )
            StatCard(
                icon = Icons.Default.VerifiedUser,
                value = badgeCount.toString(),
                label = "Badges",
                modifier = Modifier.weight(1f)
            )
            StatCard(
                icon = Icons.Default.DirectionsCar,
                value = vehicleCount.toString(),
                label = "Vehicles",
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Composable
fun StatCard(
    icon: ImageVector,
    value: String,
    label: String,
    modifier: Modifier = Modifier
){
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ){
        Column(
            modifier= Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ){
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.tertiary,
                modifier = Modifier.size(28.dp)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
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
//        Text(
//            text = "Delete Account",
//            style = MaterialTheme.typography.titleMedium,
//            color = MaterialTheme.colorScheme.error
//        )
    }
}

@Preview(showBackground = true)
@Composable
fun ProfilePreview() {
    DrivingTrackerTheme {
        Profile()
    }
}