package com.omnitech.drivingtracker.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AddAPhoto
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.FilterChip
import androidx.compose.ui.platform.testTag

@Composable
fun AddVehicleButton(modifier: Modifier = Modifier, onClick: () -> Unit) {

    Column(
        modifier = modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(vertical = 32.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = Icons.Default.Add,
            contentDescription = null,
            modifier = Modifier.size(48.dp)
        )
        Text(text = "Add Vehicle", style = MaterialTheme.typography.bodyMedium)
    }

}

@Composable
fun AddVehicleDialog(
    onDismiss: () -> Unit,
    onConfirm: (String, String?, String, String, Int, String) -> Unit,
    onPickImage: () -> Unit,
    selectedImageUri: String?
) {

    var name by remember { mutableStateOf("") }
    var registration by remember { mutableStateOf("") }
    var make by remember { mutableStateOf("") }
    var model by remember { mutableStateOf("") }
	var year by remember { mutableStateOf("") }
	var fuelType by remember { mutableStateOf("PETROL") }

    AlertDialog(

        onDismissRequest = onDismiss,
        title = { Text("Add New Vehicle") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                //Clickable image placeholder
                Box(
                    modifier = Modifier
                        .size(100.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color.LightGray)
                        .clickable { onPickImage() }
                        .align(Alignment.CenterHorizontally),
                    contentAlignment = Alignment.Center
                ){
                    VehicleImage(imageRes = null, imageUri = selectedImageUri, modifier = Modifier.fillMaxSize())
                    if (selectedImageUri == null) Icon(Icons.Default.AddAPhoto, null)
                }

                OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Name") }, modifier = Modifier.testTag("addVehicleName"))
                OutlinedTextField(value = registration, onValueChange = { registration = it }, label = { Text("Registration") }, modifier = Modifier.testTag("addVehicleRegistration"))
                OutlinedTextField(value = make, onValueChange = { make = it }, label = { Text("Make") }, modifier = Modifier.testTag("addVehicleMake"))
                OutlinedTextField(value = model, onValueChange = { model = it }, label = { Text("Model") }, modifier = Modifier.testTag("addVehicleModel"))
				OutlinedTextField(value = year, onValueChange = { year = it }, label = { Text("Year") }, modifier = Modifier.testTag("addVehicleYear"))

                Spacer(modifier = Modifier.height(4.dp))
                Text("Fuel Type", style = MaterialTheme.typography.labelLarge)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val options = listOf("Petrol", "Diesel", "Electric")
                    options.forEach { option ->
                        val isSelected = fuelType.equals(option, ignoreCase = true)
                        FilterChip(
                            selected = isSelected,
                            onClick = { fuelType = option.uppercase()},
                            label = { Text(option)},
                            leadingIcon = if(isSelected){
                                {Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(18.dp))}
                            }else null
                        )
                    }
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = { onConfirm(name, registration.ifBlank{null}, make, model, year.toIntOrNull() ?: 0, fuelType) },
                enabled = name.isNotBlank() && make.isNotBlank() && model.isNotBlank() && year.isNotBlank(),
                modifier = Modifier.testTag("addVehicleConfirmButton")
            ) {
                Text("Add")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }

    )

}