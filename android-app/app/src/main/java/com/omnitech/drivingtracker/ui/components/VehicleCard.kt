package com.omnitech.drivingtracker.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.MoreHoriz
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.omnitech.drivingtracker.ui.obd.Vehicle
import com.omnitech.drivingtracker.ui.components.VehicleImage
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow

@Composable
fun VehicleCard(
    vehicle: Vehicle,
    onDrivingInfoClick: () -> Unit,
    onEditNameClick: () -> Unit,
    onEditImageClick: () -> Unit,
    onRemoveClick: () -> Unit
) {

    var showMenu by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFE5E5E5))
    ) {
        Column(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ){
            // Name, Mileage and Menu
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    modifier = Modifier.weight(1f),
                    verticalAlignment = Alignment.CenterVertically
                ){
                    Text(
                        text = vehicle.name,
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f, fill=false)
                    )

                    Spacer(modifier = Modifier.width(12.dp))

                    //Mileage pill
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = Color(0xFF2D8CFF) //blue background
                    ) {
                        Text(
                            text = "${String.format("%,d", vehicle.mileage).replace(',', ' ')}km",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Color.White,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                            fontWeight = FontWeight.Medium
                        )
                    }
                }

                //Spacer(modifier = Modifier.weight(1f))

                //Vertical 3 dots
                Box{

                    IconButton(onClick = { showMenu = true },
                        modifier = Modifier.testTag("buttonVehicleOptions${vehicle.name}")) {
                        Icon(imageVector = Icons.Default.MoreVert, contentDescription = "Options")
                    }

                    DropdownMenu(
                        expanded = showMenu,
                        onDismissRequest = { showMenu = false },
                        modifier = Modifier
                            .background(Color.White)
                            .clip(RoundedCornerShape(8.dp))
                    ) {

                        DropdownMenuItem(
                            text = { Text("Edit Vehicle", modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center) },
                            onClick = {
                                showMenu = false
                                onEditNameClick()
                            }
                        )

                        HorizontalDivider(modifier = Modifier.padding(horizontal = 8.dp))

                        DropdownMenuItem(
                            text = { Text("Edit Image", modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center) },
                            onClick = {
                                showMenu = false
                                onEditImageClick()
                            }
                        )

                        HorizontalDivider(modifier = Modifier.padding(horizontal = 8.dp))

                        DropdownMenuItem(
                            text = { Text("Driving Info", modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center) },
                            onClick = {
                                showMenu = false
                                onDrivingInfoClick()
                            }
                        )

                        HorizontalDivider(modifier = Modifier.padding(horizontal = 8.dp))

                        DropdownMenuItem(
                            text = { Text("Remove Vehicle", modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center) },
                            onClick = {
                                showMenu = false
                                onRemoveClick()
                            }
                        )

                    }

                }

            }

            //Vehicle Image
            VehicleImage(
                imageRes = vehicle.imageRes,
                imageUri = vehicle.imageUri,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .clip(RoundedCornerShape(16.dp))
            )

            //Vehicle Brand and Model
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ){

                Text(
                    text = vehicle.brand,
                    style = MaterialTheme.typography.titleMedium,
                    color = Color.Gray
                )

                Spacer(modifier = Modifier.width(12.dp))

                Text(
                    text = vehicle.model,
                    style = MaterialTheme.typography.titleLarge,
                    color = Color.Gray.copy(alpha = 0.7f)
                )

            }




        }
    }

}

@Composable
fun EditVehicleDialog(
    vehicle: Vehicle,
    onDismiss: () -> Unit,
    onConfirm: (String, String?, String, String, Int, String) -> Unit
){
    var name by remember { mutableStateOf(vehicle.name) }
    var registration by remember { mutableStateOf(vehicle.registration ?: "") }
    var make by remember { mutableStateOf(vehicle.brand) }
    var model by remember { mutableStateOf(vehicle.model) }
    var year by remember { mutableStateOf(vehicle.year?.toString() ?: "") }
    var fuelType by remember { mutableStateOf(vehicle.fuelType ?: "PETROL") }
    var fuelTank by remember { mutableStateOf(50.0f.toString()) } // still might make it user side instead of obd

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Edit Vehicle") },
        text = {
            Column(modifier = Modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Name") })
               OutlinedTextField(value = registration, onValueChange = { registration = it }, label = { Text("Registration") })
               OutlinedTextField(value = make, onValueChange = { make = it }, label = { Text("Make") })
               OutlinedTextField(value = model, onValueChange = { model = it }, label = { Text("Model") })
               OutlinedTextField(value = year, onValueChange = { year = it }, label = { Text("Year") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
//               OutlinedTextField(value = fuelTank, onValueChange = { fuelTank = it }, label = { Text("Tank Size") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal))
           }
        },
        confirmButton = {
            TextButton(onClick = {
                onConfirm(name, registration, make, model, year.toIntOrNull() ?: 0, fuelType)
            }) { Text("Save") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )

}