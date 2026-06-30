package com.omnitech.drivingtracker.ui.notification

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBackIosNew
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Button
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.navigation.NavController
import com.omnitech.drivingtracker.data.local.SessionManager
import com.omnitech.drivingtracker.ui.components.TopBar
import com.omnitech.drivingtracker.ui.home.Dashboard
import com.omnitech.drivingtracker.ui.home.DashboardViewModel
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme

@Composable
fun NotificationRationale(
    onPermissionHandled: () -> Unit,
    viewModel: NotificationViewModel = hiltViewModel()
) {

    val context = LocalContext.current

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        onPermissionHandled()
    }

    val isGranted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        ContextCompat.checkSelfPermission(context,
            Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
    } else true

    LaunchedEffect(isGranted) {
        if(isGranted) {
            onPermissionHandled()
        }
    }

    Scaffold(topBar = {
        TopBar(
            leftIcon = Icons.Default.ArrowBackIosNew,
            rightIcon = Icons.Default.Settings,
            onLeftClick = {/*Open menu*/ },
            onRightClick = {/*Open settings*/ }
        )
    }) { innerPadding ->

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp, vertical = 24.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            item{
                Text("Get the most out of Driving Tracker")
                Text("We'll alert you about speeding, harsh braking and let trusted contacts follow your shared trips.")
            }

            item{
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 3.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Button(onClick = {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {

                            val isDeniedOnce = (context as Activity)
                                .shouldShowRequestPermissionRationale(Manifest.permission.POST_NOTIFICATIONS)

                            if( !isDeniedOnce && viewModel.hasRequestedBefore()) {
                                val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                                    data = Uri.fromParts("package", context.packageName, null)
                                }

                                context.startActivity(intent)
                            }else {
                                viewModel.markAsRequested()
                                permissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                            }
                        } else {
                            onPermissionHandled()
                        }

                    }) {
                        Text("Enable Notifications")
                    }

                    TextButton(onClick = { onPermissionHandled() }) {
                        Text("Not now")
                    }
                }

            }

        }
    }
}

@Preview(showBackground = true)
@Composable
fun NotificationRationalePreview() {
    DrivingTrackerTheme {
        NotificationRationale(onPermissionHandled = {})
    }
}