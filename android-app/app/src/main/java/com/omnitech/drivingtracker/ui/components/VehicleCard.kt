package com.omnitech.drivingtracker.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.shape.RoundedCornerShape
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

                Text(
                    text = vehicle.name,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold
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

                Spacer(modifier = Modifier.weight(1f))

                //Vertical 3 dots
                Box{

                    IconButton(onClick = { showMenu = true }) {
                        Icon(imageVector = Icons.Default.MoreVert, contentDescription = "Options")
                    }

                    DropdownMenu(
                        expanded = showMenu,
                        onDismissRequest = { showMenu = false },
                        modifier = Modifier.background(Color.White).clip(RoundedCornerShape(8.dp))
                    ) {

                        DropdownMenuItem(
                            text = { Text("Edit Name", modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center) },
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
fun EditNameDialog(
    vehicle: Vehicle,
    onDismiss: () -> Unit,
    onConfirm: (String) -> Unit
){

    var text by remember { mutableStateOf(vehicle.name) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Edit Name") },
        text = {
            OutlinedTextField(
                value = text,
                onValueChange = { text = it },
                label = { Text("New Name") },
                singleLine = true
            )
        },
        confirmButton = {
            TextButton(onClick = { onConfirm(text) }) { Text("Save") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )

}