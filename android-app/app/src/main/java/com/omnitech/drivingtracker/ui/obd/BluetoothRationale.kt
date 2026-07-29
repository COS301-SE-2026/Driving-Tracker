package com.omnitech.drivingtracker.ui.obd

import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import com.omnitech.drivingtracker.ui.components.Permissions
import android.Manifest
import androidx.compose.runtime.LaunchedEffect
import kotlin.emptyArray
import androidx.core.content.ContextCompat
import androidx.compose.ui.window.Dialog

@Composable
fun BluetoothRationale(
    onPermissionHandled: () -> Unit,
    viewModel: ObdViewModel = hiltViewModel()
){
    val context = LocalContext.current
    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) {
        _ -> onPermissionHandled()
    }
    val requiredPermissions = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S){
        arrayOf(Manifest.permission.BLUETOOTH_SCAN, Manifest.permission.BLUETOOTH_CONNECT)
    }else{
        emptyArray()
    }

    val isGranted = requiredPermissions.all{
        ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED
    }

    LaunchedEffect(isGranted){
        if (isGranted) onPermissionHandled()
    }

    fun shouldOpenSettings(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return false

        val isDeniedOnce = requiredPermissions.any{ (context as Activity)
            .shouldShowRequestPermissionRationale(it)
        }

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
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            permissionLauncher.launch(requiredPermissions)
        }
    }
        fun onEnableBluetoothClick (){
        when {
            Build.VERSION.SDK_INT < Build.VERSION_CODES.S -> onPermissionHandled()
            shouldOpenSettings() -> openAppSettings()
            else -> requestPermission()
        }
        }

    Dialog (
        onDismissRequest = {onPermissionHandled()}
    ){
        Permissions(
            description = "Allow Bluetooth to find, connect to, and determine " +
                    "the relative position of nearby devices?",
            focus = "Bluetooth",
            onAllow = {onEnableBluetoothClick()},
            onDontAllow = {onPermissionHandled()}
        )
    }
}