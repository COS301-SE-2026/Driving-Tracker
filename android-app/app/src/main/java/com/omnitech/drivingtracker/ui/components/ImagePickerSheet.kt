package com.omnitech.drivingtracker.ui.components

import android.net.Uri
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState
import android.Manifest

@OptIn(ExperimentalPermissionsApi::class, ExperimentalMaterial3Api::class)
@Composable
fun ImagePickerSheet(
    onImageSelected: (Uri) -> Unit,
    onDismiss: () -> Unit
) {

    val context = LocalContext.current
    val galleryLauncher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri?.let { onImageSelected(it) }
        onDismiss()
    }

    //Permission states using Accompanist
    val cameraPermission = rememberPermissionState(Manifest.permission.CAMERA)
    val storagePermission = rememberPermissionState(
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) Manifest.permission.READ_MEDIA_IMAGES
        else Manifest.permission.READ_EXTERNAL_STORAGE
    )

    ModalBottomSheet(onDismissRequest = onDismiss) {

        Column(
            modifier = Modifier.fillMaxWidth().padding(16.dp).padding(bottom = 32.dp)
        ) {

            Text("Select Image Source", style = MaterialTheme.typography.titleLarge)

            Spacer(modifier = Modifier.height(16.dp))

            ListItem(
                headlineContent = { Text("Camera") },
                leadingContent = { Icon(Icons.Default.CameraAlt, null) },
                modifier = Modifier.clickable {
                    if (cameraPermission.status.isGranted) {
                        //Launch camera logic (requires FilePrvider for full res
                    } else {
                        cameraPermission.launchPermissionRequest()
                    }
                }
            )

            ListItem(
                headlineContent = { Text("Gallery") },
                leadingContent = { Icon(Icons.Default.PhotoLibrary, null) },
                modifier = Modifier.clickable {
                    if (storagePermission.status.isGranted) {
                        galleryLauncher.launch("image/*")
                    } else {
                        cameraPermission.launchPermissionRequest()
                    }
                }
            )

        }

    }

}