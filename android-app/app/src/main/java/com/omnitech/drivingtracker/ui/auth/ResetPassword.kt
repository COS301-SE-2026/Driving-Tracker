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
){
    var newPassword by remember { mutableStateOf("") }
    var isNewPasswordVisible by remember { mutableStateOf(false) }
    var confirmPassword by remember { mutableStateOf("") }
    var isConfirmPasswordVisible by remember { mutableStateOf(false) }
    val uiState by viewModel.uiState.collectAsState()
    var showSuccessDialog by remember { mutableStateOf(false) }

    Column(modifier = Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center){
        Text("Create New Password", style = MaterialTheme.typography.headlineMedium)
        Spacer(modifier = Modifier.height(24.dp))
        OutlinedTextField(
            value = newPassword,
            onValueChange = { newPassword = it },
            label = { Text("New Password") },
            visualTransformation = if(isNewPasswordVisible) VisualTransformation.None
                                    else PasswordVisualTransformation(),
            trailingIcon = {
                IconButton(onClick = {
                    isNewPasswordVisible = !isNewPasswordVisible
                }) {
                    Icon(
                        imageVector = if(isNewPasswordVisible){
                            Icons.Filled.Visibility
                        }else{
                            Icons.Filled.VisibilityOff
                        },
                        contentDescription = if(isNewPasswordVisible){
                            "Hide new password"
                        }else{
                            "Show new password"
                        }
                    )
                }
            },
            modifier = Modifier.fillMaxWidth()
        )
        OutlinedTextField(
            value = confirmPassword,
            onValueChange = { confirmPassword = it },
            label = { Text("Confirm New Password") },
            visualTransformation = if(isConfirmPasswordVisible) VisualTransformation.None
            else PasswordVisualTransformation(),
            trailingIcon = {
                IconButton(onClick = {
                    isConfirmPasswordVisible = !isConfirmPasswordVisible
                }) {
                    Icon(
                        imageVector = if(isConfirmPasswordVisible){
                            Icons.Filled.Visibility
                        }else{
                            Icons.Filled.VisibilityOff
                        },
                        contentDescription = if(isConfirmPasswordVisible){
                            "Hide confirmed password"
                        }else{
                            "Show confirmed password"
                        }
                    )
                }
            },
            modifier = Modifier.fillMaxWidth()
        )
        Button(
            onClick = { viewModel.resetPassword(token, newPassword)},
            modifier = Modifier.fillMaxWidth().padding(top = 24.dp),
            enabled = newPassword.isNotEmpty() && newPassword == confirmPassword
        ){
            Text("Update Password")
        }
    }
    if(uiState is AuthViewModel.UiState.Success){
        LaunchedEffect(Unit){
            showSuccessDialog = true
        }
    }

    if(showSuccessDialog){
        AlertDialog(onDismissRequest = {
            showSuccessDialog = false
            onResetSuccess()
        },
            title = {
                Text("Password Reset Successful")
            },
            text = {
                Text("Your password has been reset successfully.")
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        showSuccessDialog = false
                        onResetSuccess()
                    }
                ){
                    Text("OK")
                }
            }
            )
    }
}