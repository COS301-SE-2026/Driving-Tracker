package com.omnitech.drivingtracker.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun AddVehicleButton(onClick: () -> Unit) {

    Column(
        modifier = Modifier
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
    onConfirm: (String, String, String) -> Unit
) {

    var alias by remember { mutableStateOf("") }
    var brand by remember { mutableStateOf("") }
    var model by remember { mutableStateOf("") }

    AlertDialog(

        onDismissRequest = onDismiss,
        title = { Text("Add New Vehicle") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = alias, onValueChange = { alias = it }, label = { Text("Alias") })
                OutlinedTextField(value = brand, onValueChange = { brand = it }, label = { Text("Brand") })
                OutlinedTextField(value = model, onValueChange = { model = it }, label = { Text("Model") })
            }
        },
        confirmButton = {
            TextButton(
                onClick = { onConfirm(alias, brand, model) },
                enabled = alias.isNotBlank() && brand.isNotBlank() && model.isNotBlank()
            ) {
                Text("Add")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }

    )

}