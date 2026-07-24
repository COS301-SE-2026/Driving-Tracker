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
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.tooling.preview.Preview
import androidx.core.content.ContextCompat
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import com.omnitech.drivingtracker.ui.components.Permissions
import androidx.compose.ui.window.Dialog

@Composable
fun NotificationRationale(
    onPermissionHandled: () -> Unit,
    viewModel: NotificationViewModel = hiltViewModel()
) {

    val context = LocalContext.current

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { _ ->
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

    fun shouldOpenSettings(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return false

        val isDeniedOnce = (context as Activity)
            .shouldShowRequestPermissionRationale(Manifest.permission.POST_NOTIFICATIONS)

        return !isDeniedOnce && viewModel.hasRequestedBefore()
    }

    fun openAppSettings() {
        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
            data = Uri.fromParts("package", context.packageName, null)
        }

        context.startActivity(intent)
    }

    fun requestPermission() {
        viewModel.markAsRequested()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    fun onEnableNotificationsClick() {
        when {
            Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU -> onPermissionHandled()
            shouldOpenSettings() -> openAppSettings()
            else -> requestPermission()
        }
    }

    Dialog (
        onDismissRequest = {onPermissionHandled()}
    ){
        Permissions(
        description = "Get the most out of Driving Tracker by using Notifications. " +
                "We'll alert you about speeding, harsh braking and let trusted " +
                "contacts follow your shared trips. ",
        focus = "Notifications",
        onAllow = {onEnableNotificationsClick()},
        onDontAllow = {onPermissionHandled()}
        )
    }
}

@Preview(showBackground = true)
@Composable
fun NotificationRationalePreview() {
    DrivingTrackerTheme {
        NotificationRationale(onPermissionHandled = {})
    }
}