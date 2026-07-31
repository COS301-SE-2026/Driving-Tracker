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
import com.omnitech.drivingtracker.ui.components.EditNameDialog
import com.omnitech.drivingtracker.ui.components.ImagePickerSheet
import com.omnitech.drivingtracker.ui.components.AddVehicleDialog
import com.omnitech.drivingtracker.ui.theme.*
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.ui.Alignment
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import com.omnitech.drivingtracker.ui.components.VehicleInfoCard
import com.omnitech.drivingtracker.ui.contacts.ContactsViewModel
import com.omnitech.drivingtracker.ui.other.More
import com.omnitech.drivingtracker.ui.vehicles.VehiclesViewModel
import kotlin.collections.forEach
import java.util.UUID
import com.omnitech.drivingtracker.Screen


//Data model for vehicle UI
data class Vehicle(
    val id: String,
    val name: String,
    val brand: String,
    val model: String,
    val mileage: Int,
    val trips: Int,
    val fuelEfficiency: Double,
    val needsService: Boolean,
    val imageRes: Int? = null,
    val imageUri: String? = null,
    val registration: String? = null,
    val year: Int? = null,
    val fuelType: String? = null
)

@Composable
fun Vehicles(
    navController: NavController? = null,
    viewModel: VehiclesViewModel = hiltViewModel()
) {

    val uiState by viewModel.uiState.collectAsState()

    var selectedVehicleForStats by remember { mutableStateOf<Vehicle?>(null) }
    var vehicleToEditName by remember { mutableStateOf<Vehicle?>(null) }
    var vehicleToEditImage by remember { mutableStateOf<Vehicle?>(null) }
    var showAddVehicleDialog by remember { mutableStateOf(false) }
    var showImagePicker by remember { mutableStateOf(false) }
    var tempNewVehicleImage by remember { mutableStateOf<String?>(null) }
    var vehicleToRemove by remember { mutableStateOf<Vehicle?>(null) }

    //sample data
//    val vehicleList = remember {
//        mutableStateListOf(
//            Vehicle("1", "Lucile", "BMW", "M3 Competition", 100000, 17, 8.0, true),
//            Vehicle("2", "Khaleesi", "Range Rover", "Sport", 50000, 10, 13.2, false),
//        )
//    }

    Scaffold(
        topBar = {
            TopBar(
                leftIcon = Icons.AutoMirrored.Filled.ArrowBack,
                rightIcon = Icons.Default.Settings,
                onLeftClick = { navController?.popBackStack() },
                onRightClick = { navController?.navigate(Screen.Settings.route) }
            )
        },
        bottomBar = {
            BottomNavBar(navController = navController, color = "none")
        }
    ) { paddingValues ->
        Box(modifier = Modifier.fillMaxSize().padding(paddingValues)){
            when(val state = uiState){
                is VehiclesViewModel.UiState.Loading -> {
                    CircularProgressIndicator(modifier = Modifier.align ( Alignment.Center ))
                }
                is VehiclesViewModel.UiState.Error -> {
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ){
                        Text(text = state.message, color = Color.Red)
                        Button(onClick = { viewModel.loadVehicles() }) { Text("Retry")}
                    }
                }
                is VehiclesViewModel.UiState.Success -> {
                    val vehicles = state.vehicles.map {
                        dto -> Vehicle(
                            id = dto.vehicleId,
                            name = dto.name?: "Unnamed",
                            brand = dto.make ?: "",
                            model = dto.model ?: "",
                            mileage = dto.mileage?: 0,
                            trips = dto.tripCount?: 0,
                            fuelEfficiency = dto.avgFuelEfficiency?: 0.0,
                            needsService = false,
                            registration = dto.registration,
                            year = dto.year,
                            fuelType = dto.fuelType
                        )
                    }
                    LazyColumn(
                        modifier =  Modifier
                            .fillMaxSize().testTag("vehicleList")
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

                        items(vehicles, key = { it.id }) { vehicle ->
                            VehicleCard(
                                vehicle = vehicle,
                                onDrivingInfoClick = { selectedVehicleForStats = vehicle },
                                onEditNameClick = { vehicleToEditName = vehicle },
                                onEditImageClick = {
                                    vehicleToEditImage = vehicle
                                    showImagePicker = true
                                },
                                onRemoveClick = { vehicleToRemove = vehicle }
                            )
                        }
                        item {
                            AddVehicleButton(
                                modifier = Modifier.testTag("buttonOpenAddVehicleDialog"),
                                onClick = { showAddVehicleDialog = true })
                        }
                    }
                }
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

    //Edit Name Dialog
    vehicleToEditName?.let { vehicle ->
        EditNameDialog(
            vehicle = vehicle,
            onDismiss = { vehicleToEditName = null },
            onConfirm = { newName ->
                viewModel.updateVehicleName(vehicle.id, newName)
                vehicleToEditName = null
            }
        )
    }

    //Remove Vehicle Confirm dialog
    vehicleToRemove?.let { vehicle ->
        AlertDialog(
            onDismissRequest = { vehicleToRemove = null },
            title = { Text("Remove Vehicle") },
            text = { Text("Are you sure you want to remove ${vehicle.name}? This action cannot be undone.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.removeVehicle(vehicle.id)
                        vehicleToRemove = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Red, contentColor = Color.White)
                ) {
                    Text("Remove")
                }
            },
            dismissButton = {
                TextButton(onClick = { vehicleToRemove = null }) {
                    Text("Cancel")
                }
            }
        )
    }

    //Image Picker Logic
    if (showImagePicker) {

        ImagePickerSheet(
            onImageSelected = { uri ->
                //TODO implement image upload logic
                showImagePicker = false
                vehicleToEditImage = null
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
            onConfirm = { name, registration, make, model, year, fuelType ->
                viewModel.addVehicle( name, registration, make, model, year, fuelType)
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