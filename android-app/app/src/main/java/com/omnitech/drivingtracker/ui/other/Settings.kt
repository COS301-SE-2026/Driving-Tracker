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


@Composable
fun Settings(navController: NavController? =null,
             darkMode: Boolean,
             onDarkModeChange: (Boolean) -> Unit
             )
{
    StandardScreen(
        navController = navController,
        title = "Settings",
        showBottomBar = false
    ) {
        Spacer(modifier = Modifier.height(20.dp))

        SettingOption(
            icon = Icons.Default.Notifications,
            label = "Notifications",
            rightSide = {Switch(checked = true, onCheckedChange = {/*I dont know what should be done yet*/})}
        )

        HLine()

        SettingOption(
            icon = Icons.Default.ShieldMoon,
            label = "Dark Mode",
            rightSide = {Switch(checked = darkMode, onCheckedChange = onDarkModeChange)}
        )

        HLine()
        Spacer(modifier = Modifier.height(18.dp))

        SettingOption(
            icon = Icons.Default.StarRate,
            label = "Rate App",
            onClick = {}
        )

        HLine()
        Spacer(modifier = Modifier.height(18.dp))

        SettingOption(
            icon = Icons.Default.Share,
            label = "Share App",
            onClick = {}
        )

        HLine()
        Spacer(modifier = Modifier.height(18.dp))

        SettingOption(
            icon = Icons.Default.Lock,
            label = "Privacy Policy",
            onClick = {}
        )

        HLine()
        Spacer(modifier = Modifier.height(18.dp))

        SettingOption(
            icon = Icons.AutoMirrored.Filled.Logout,
            label = "Logout",
            onClick = {navController?.navigate(Screen.Login.route){
                popUpTo(0) {inclusive = true}
            } }
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
        Settings(navController = rememberNavController(), darkMode = false, onDarkModeChange = {})
    }
}