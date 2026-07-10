package com.omnitech.drivingtracker.ui.obd

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.background
import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.LineHeightStyle
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.navigation.NavController
import com.omnitech.drivingtracker.R
import com.omnitech.drivingtracker.ui.components.TopBar
import com.omnitech.drivingtracker.ui.components.BottomNavBar
import com.omnitech.drivingtracker.ui.components.VehicleCard
import com.omnitech.drivingtracker.ui.components.AddVehicleButton
import com.omnitech.drivingtracker.ui.components.EditAliasDialog
import com.omnitech.drivingtracker.ui.components.ImagePickerSheet
import com.omnitech.drivingtracker.ui.components.AddVehicleDialog
import com.omnitech.drivingtracker.ui.theme.*
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.ui.Alignment
import androidx.compose.ui.graphics.Color
import com.omnitech.drivingtracker.ui.components.VehicleInfoCard
import kotlin.collections.forEach
import java.util.UUID


//Data model for vehicle UI
data class Vehicle(
    val id: String,
    val alias: String,
    val brand: String,
    val model: String,
    val mileage: Int,
    val trips: Int,
    val fuelEfficiency: Double,
    val needsService: Boolean,
    val imageRes: Int? = null,
    val imageUri: String? = null
)

@Composable
fun Vehicles(
    navController: NavController? = null
) {

    var selectedVehicleForStats by remember { mutableStateOf<Vehicle?>(null) }
    var vehicleToEditAlias by remember { mutableStateOf<Vehicle?>(null) }
    var vehicleToEditImage by remember { mutableStateOf<Vehicle?>(null) }
    var showAddVehicleDialog by remember { mutableStateOf(false) }
    var showImagePicker by remember { mutableStateOf(false) }
    var tempNewVehicleImage by remember { mutableStateOf<String?>(null) }

    //sample data
    val vehicleList = remember {
        mutableStateListOf(
            Vehicle("1", "Lucile", "BMW", "M3 Competition", 100000, 17, 8.0, false),
            Vehicle("2", "Khaleesi", "Range Rover", "Sport", 50000, 10, 10.1, true)
        )
    }

    Scaffold(
        topBar = {
            TopBar(
                leftIcon = Icons.AutoMirrored.Filled.ArrowBack,
                rightIcon = Icons.Default.Settings,
                onLeftClick = { navController?.popBackStack() },
                onRightClick = { /*handle settings click*/ }
            )
        },
        bottomBar = {
            BottomNavBar(navController = navController, color = "none")
        }
    ) { paddingValues ->
        LazyColumn(
            modifier =  Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(top = 8.dp, bottom = 80.dp)
        ) {
            item{//Header section
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp),
                    horizontalArrangement = Arrangement.Center
                ){
                    Text("Your ", style = MaterialTheme.typography.titleMedium )
                    Text("Vehicles", style = MaterialTheme.typography.titleLarge, color = Blue)
                }
            }

            items(vehicleList, key = { it.id }) { vehicle ->
                VehicleCard(
                    vehicle = vehicle,
                    onDrivingInfoClick = { selectedVehicleForStats = vehicle },
                    onEditAliasClick = { vehicleToEditAlias = vehicle },
                    onEditImageClick = {
                        vehicleToEditImage = vehicle
                        showImagePicker = true
                    }
                )
            }

            item {
                AddVehicleButton(onClick = { showAddVehicleDialog = true })
            }

        }
    }

    //Stats Popup (Driving Info)
    selectedVehicleForStats?.let { vehicle ->
        VehicleInfoCard(
            vehicle = vehicle,
            onDismiss = { selectedVehicleForStats = null }
        )
    }

    //Edit Alias Dialog
    vehicleToEditAlias?.let { vehicle ->
        EditAliasDialog(
            vehicle = vehicle,
            onDismiss = { vehicleToEditAlias = null },
            onConfirm = { newAlias ->
                val index = vehicleList.indexOfFirst { it.id == vehicle.id }
                if (index != -1) {
                    vehicleList[index] = vehicleList[index].copy(alias = newAlias)
                }
                vehicleToEditAlias = null
            }
        )
    }

    //Image Picker Logic
    if (showImagePicker) {

        ImagePickerSheet(
            onImageSelected = { uri ->
                if (vehicleToEditImage != null) {
                    //Updating existing vehicle image
                    val index = vehicleList.indexOfFirst { it.id == vehicleToEditImage!!.id }
                    if (index != -1) {
                        vehicleList[index] = vehicleList[index].copy(imageUri = uri.toString())
                    }
                    vehicleToEditImage = null
                } else {
                    //Setting image for new vehicle
                    tempNewVehicleImage = uri.toString()
                }
                showImagePicker = false
            },
            onDismiss = {
                showImagePicker = false
                vehicleToEditImage = null
            }
        )

    }

    //Add Vehicle
    if (showAddVehicleDialog) {
        AddVehicleDialog(
            selectedImageUri = tempNewVehicleImage,
            onPickImage = { showImagePicker = true },
            onDismiss = {
                showAddVehicleDialog = false
                tempNewVehicleImage = null
            },
            onConfirm = { alias, brand, model, uri ->
                vehicleList.add(Vehicle(UUID.randomUUID().toString(), alias, brand, model, 0, 0, 0.0, false, imageUri = uri))
                showAddVehicleDialog = false
                tempNewVehicleImage = null
            }
        ) 
    }

}



@Preview(showBackground = true)
@Composable
fun VehiclesPreview() {
    DrivingTrackerTheme {
        Vehicles()
    }
}