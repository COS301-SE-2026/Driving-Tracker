package com.omnitech.drivingtracker.ui.auth

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.Text
import androidx.compose.material3.Button
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.material3.IconButton
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.TextButton

@Composable
fun ResetPasswordScreen(
    token: String,
    viewModel: AuthViewModel = hiltViewModel(),
    onResetSuccess: () -> Unit
) {
    var newPassword by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    val uiState by viewModel.uiState.collectAsState()
    var showSuccessDialog by remember { mutableStateOf(false) }

    var isFormValid = newPassword.isNotEmpty() && newPassword == confirmPassword

    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("Create New Password", style = MaterialTheme.typography.headlineMedium)
        Spacer(modifier = Modifier.height(24.dp))

        PasswordField(
            value = newPassword,
            onValueChange = { newPassword = it },
            label = "New Password"
        )

        PasswordField(
            value = confirmPassword,
            onValueChange = { confirmPassword = it },
            label = "Confirm New Password"
        )

        Button(
            onClick = { viewModel.resetPassword(token, newPassword) },
            modifier = Modifier.fillMaxWidth().padding(top = 24.dp),
            enabled = isFormValid
        ) {
            Text("Update Password")
        }

        LaunchedEffect(uiState) {
            if (uiState is AuthViewModel.UiState.Success) {
                showSuccessDialog = true
            }
        }

        SuccessDialog(
            show = showSuccessDialog,
            onConfirm = {
                showSuccessDialog = false
                onResetSuccess()
            }
        )
    }
}

@Composable
private fun PasswordField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier
){
    var isVisible by remember { mutableStateOf(false) }

    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        visualTransformation = if(isVisible) VisualTransformation.None
        else PasswordVisualTransformation(),
        trailingIcon = {
            val icon = if(isVisible) Icons.Filled.Visibility else Icons.Filled.VisibilityOff
            val description = if(isVisible) "Hide $label" else "Show $label"

            IconButton(onClick = {
                isVisible = !isVisible
            }) {
                Icon(
                    imageVector = icon, contentDescription = description
                )
            }
        },
        modifier = Modifier.fillMaxWidth()
    )
}

@Composable
private fun SuccessDialog(
    show: Boolean,
    onConfirm: () -> Unit
){
    if(show){
        AlertDialog(
            onDismissRequest = onConfirm,
            title = {
                Text("Password Reset Successful")
            },
            text = {
                Text("Your password has been reset successfully.")
            },
            confirmButton = {
                TextButton(
                    onClick = onConfirm
                ){
                    Text("OK")
                }
            }
        )
    }
}
