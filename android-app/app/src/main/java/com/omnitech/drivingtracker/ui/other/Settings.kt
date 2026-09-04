package com.omnitech.drivingtracker.ui.other
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
import com.omnitech.drivingtracker.ui.components.StandardScreen
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import androidx.compose.foundation.layout.Spacer
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.height
import androidx.compose.ui.Alignment
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.ShieldMoon
import androidx.compose.material.icons.filled.StarRate
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import com.omnitech.drivingtracker.Screen
import androidx.compose.material3.Switch
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import com.omnitech.drivingtracker.ui.auth.AuthViewModel
import com.omnitech.drivingtracker.ui.auth.AuthViewModel.UiState
import androidx.compose.runtime.*
import com.omnitech.drivingtracker.ui.components.DeleteAccountDialog


@Composable
fun Settings(
    navController: NavController? = null,
    darkMode: Boolean = false,
    onDarkModeChange: (Boolean) -> Unit,
    authViewModel: AuthViewModel = hiltViewModel(),
    viewModel: SettingsViewModel = hiltViewModel(),
    onAccountDeleted: () -> Unit
){

    val authState by authViewModel.uiState.collectAsState()

    LaunchedEffect(authState) {
        if(authState is UiState.SuccessLogout){

            navController?.navigate(Screen.Welcome.route){ popUpTo(0) {inclusive = true} }
        }
    }

    var showDeleteDialog by remember { mutableStateOf (false) }
    val deleteState by viewModel.deleteAccountState.collectAsState()

    LaunchedEffect(deleteState) {
        if (deleteState is DeleteAccountState.Success){
            showDeleteDialog = false
            onAccountDeleted()
        }
    }

    StandardScreen(
        navController = navController,
        title = "Settings",
        onLeftClick = {navController?.popBackStack()},
        onRightClick = {navController?.navigate(Screen.Settings.route)}
    ) {
        SettingOption(
            icon = Icons.AutoMirrored.Filled.Logout,
            label = "Logout",
            onClick = { authViewModel.logout() }
        )

        HLine()
        Spacer(modifier = Modifier.height(18.dp))


        SettingOption(
            icon = Icons.Filled.Delete,
            label = "Delete Account",
            onClick = { showDeleteDialog = true }
        )
    }

    if (showDeleteDialog){
        DeleteAccountDialog(
            isLoading = deleteState is DeleteAccountState.Loading,
            errorMessage = (deleteState as? DeleteAccountState.Error)?.message,
            onConfirm = {password -> viewModel.deleteAccount(password)},
            onDismiss = {
                showDeleteDialog = false
                viewModel.resetDeleteAccountState()
            }
        )
    }
}

@Composable
fun SettingOption(
    icon: ImageVector,
    label: String,
    onClick: (()-> Unit)? = null, //null because a row can be either clickable OR a toggle setting
    rightSide: @Composable (()-> Unit)? = null //if not null, shows a switch
){
    Row(
        modifier = Modifier.fillMaxWidth()
            .then( //
            if (onClick != null) Modifier.clickable(onClick = onClick)
            else Modifier) //row is not clickable if onClick is null (it is therefore a toggleable setting)
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ){
        LeftSide(icon = icon, label = label)
        rightSide?.invoke()
    }
}

@Composable
fun LeftSide( //Inner Row (icon + label)
    icon: ImageVector,
    label: String
){
    Row(
        verticalAlignment = Alignment.CenterVertically
    ){
        Icon(icon, contentDescription = null, modifier = Modifier.padding(end = 16.dp))
        Text(text = label, style = MaterialTheme.typography.bodyLarge)
    }
}


@Preview(showBackground = true)
@Composable
fun SettingsPreview(){
    DrivingTrackerTheme {
        Settings(navController = rememberNavController(), darkMode = false, onDarkModeChange = {},
            onAccountDeleted = {})
    }
}