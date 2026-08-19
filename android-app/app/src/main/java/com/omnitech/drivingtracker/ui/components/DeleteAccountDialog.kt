package com.omnitech.drivingtracker.ui.components

import androidx.compose.material3.AlertDialog
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
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
        icon = {
            Icon(
                imageVector = Icons.Filled.Warning,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.error,
                modifier = Modifier.size(36.dp)
            )
        },
        title = {
            Text ("Are you sure you want to delete your account?",
            textAlign = TextAlign.Center,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.fillMaxWidth()
            ) },
        text = {
            Column{
                Text(
                    "This action is permanent",
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    "Enter your password to confirm",
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(4.dp))
                OutlinedTextField(
                    value = password,
                    onValueChange = {password = it},
                    placeholder = {Text("Password")},
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
                onClick = onDismiss,
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            )
            {
                Text("Cancel")
            }
        },
        dismissButton = {
            TextButton(
                onClick = { onConfirm(password)},
                enabled = password.isNotBlank() && !isLoading
            ) {
            if (isLoading){
                CircularProgressIndicator(modifier = Modifier.size(16.dp),
                    strokeWidth = 2.dp,
                    color = MaterialTheme.colorScheme.error
                )
            }
            else{
                Text("Delete Account", color = MaterialTheme.colorScheme.error)
            }
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