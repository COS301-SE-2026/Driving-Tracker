package com.omnitech.drivingtracker.ui.components

import androidx.compose.material3.AlertDialog
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme

@Composable
fun DeleteAccountDialog(
    isLoading: Boolean,
    errorMessage: String?,
    onConfirm: (password: String) -> Unit,
    onDismiss: () -> Unit
){
    var password by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text ("Delete Account") },
        text = {
            Column{
                Text(
                    "This action is permanent and cannot be undone. " +
                            "All your trips, badges, and data will be immediately deleted."
                )
                Spacer(modifier = Modifier.height(12.dp))
                OutlinedTextField(
                    value = password,
                    onValueChange = {password = it},
                    label = {Text("Confirm your password")},
                    visualTransformation = PasswordVisualTransformation(),
                    singleLine = true,
                    isError = errorMessage != null,
                    supportingText = errorMessage?.let {{Text(it)}},
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(password)},
                enabled = password.isNotBlank() && !isLoading,
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
            ){
                if (isLoading){
                    CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                }
                else{
                    Text("Delete Account")
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !isLoading){
                Text("Cancel")
            }
        }
    )
}

@Preview(showBackground = true)
@Composable
fun DeleteAccountDialogPreview(){
    DrivingTrackerTheme {
        DeleteAccountDialog(
            isLoading = false,
            errorMessage = null,
            onConfirm = {},
            onDismiss = {}
        )
    }
}

@Preview(showBackground = true)
@Composable
fun DeleteAccountDialogErrorPreview(){
    DrivingTrackerTheme{
        DeleteAccountDialog(
            isLoading = false,
            errorMessage = "Incorrect Password",
            onConfirm = {},
            onDismiss = {}
        )
    }
}