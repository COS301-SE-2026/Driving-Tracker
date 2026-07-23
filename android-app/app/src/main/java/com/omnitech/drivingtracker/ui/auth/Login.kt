package com.omnitech.drivingtracker.ui.auth

import android.R.attr.onClick
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.lifecycle.viewmodel.compose.viewModel
import com.omnitech.drivingtracker.R
import com.omnitech.drivingtracker.ui.auth.AuthViewModel.UiState
import com.omnitech.drivingtracker.ui.theme.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel

@Composable
fun Login(
    uiState: UiState = UiState.Idle,
    onLogin: (String, String) -> Unit = { _, _ -> },
    onBackClick: () -> Unit = {}
) {

    var identifier by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    var passwordVisible by remember { mutableStateOf(false)}

    val errorCode = (uiState as? UiState.Error)?.code

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .systemBarsPadding()
            .imePadding(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {

        //The Logo
        item{
            Image(
                painter = painterResource(id = R.drawable.lg_main),
                contentDescription = "Driving Tracker logo",
                modifier = Modifier.size(150.dp)
            )
        }

        item{
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 32.dp) //Adds space between the card and screen edges
                    .padding(top = 10.dp), //Adds space between the card and logo
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, Color(0xFFE0E0E0)), //lifght grey border
                shape = RoundedCornerShape(8.dp)

            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                    horizontalAlignment = Alignment.Start
                ) {

                    // Email Section
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {

                        Text(
                            text = "Email or Username",
                            fontWeight = FontWeight.Medium,
                            fontSize = 14.sp
                        )
                        OutlinedTextField(
                            value = identifier,
                            onValueChange = { identifier=it },
                            placeholder = { Text("Email or Username", color = Color(0xFFBDBDBD)) },
                            isError = errorCode == "INVALID_CREDENTIALS",
                            modifier = Modifier.fillMaxWidth().height(50.dp),
                            shape = RoundedCornerShape(8.dp),
                            singleLine = true
                        )

                    }

                    // Password Section
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {

                        Text(
                            text = "Password",
                            fontWeight = FontWeight.Medium,
                            fontSize = 14.sp
                        )
                        OutlinedTextField(
                            value = password,
                            onValueChange = { password=it },
                            isError = errorCode == "INVALID_PASSWORD",
                            placeholder = { Text("Password", color = Color(0xFFBDBDBD)) },
                            modifier = Modifier.fillMaxWidth().height(50.dp),
                            shape = RoundedCornerShape(8.dp),
                            singleLine = true,
                            visualTransformation = if (passwordVisible) VisualTransformation.None
                            else PasswordVisualTransformation(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                            trailingIcon = {
                                val image = if (passwordVisible)
                                    Icons.Filled.Visibility
                                else Icons.Filled.VisibilityOff

                                val description = if (passwordVisible) "Hide password" else "Show password"

                                IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                    Icon(imageVector = image, contentDescription = description)
                                }
                            }
                        )
                    }
                    if(uiState is UiState.Error){
                        Text(
                            text=uiState.message,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.error,
                            modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                            textAlign = TextAlign.Center
                        )
                    }

                    //Sign In Button
                    Button(
                        onClick = {
                            onLogin(identifier, password)
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 8.dp)
                            .height(48.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Green), //Dark grey
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Sign In", color = Color.White)
                    }

                    //Forgot password
                    Text(
                        text = "Forgot password",
                        textDecoration = TextDecoration.Underline,
                        fontSize = 14.sp,
                        modifier = Modifier.padding(top = 4.dp)
                    )

                }
            }
        }

    }
}

@Composable
fun LoginScreen(
    viewModel: AuthViewModel = hiltViewModel(),
    onLoginSuccess: () -> Unit = {},
    onBackClick: () -> Unit = {}
) {

    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(uiState) { if (uiState is UiState.Success) onLoginSuccess() }

    Login(
        uiState = uiState,
        onLogin = { identifier, password -> viewModel.login(identifier, password) },
        onBackClick = onBackClick
    )
}

@Preview(showBackground=true, backgroundColor = 0xFFFFFFFF)
@Composable
fun LoginPreview(){
    DrivingTrackerTheme{
        Login()
    }
}

@Preview(showBackground=true, name = "Login error state")
@Composable
fun LoginErrorPreview(){
    DrivingTrackerTheme{
        Login(uiState = UiState.Error(
            code="INVALID_CREDENTIALS",
            message="Email/Username field is required")
        )
    }
}