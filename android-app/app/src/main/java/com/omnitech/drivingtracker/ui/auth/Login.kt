package com.omnitech.drivingtracker.ui.auth

import android.R.attr.onClick
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.unit.dp
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.compose.ui.graphics.PaintingStyle.Companion.Stroke
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.style.TextDecoration
import androidx.lifecycle.viewmodel.compose.viewModel
import com.omnitech.drivingtracker.R
import com.omnitech.drivingtracker.ui.auth.AuthViewModel.UiState
import com.omnitech.drivingtracker.ui.theme.*

@Composable
fun Login(uiState: UiState = UiState.Idle, onLogin: (String, String) -> Unit = { _ , _ -> }) {

    var identifier by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {

        //The Logo
        Image(
            painter = painterResource(id = R.drawable.lg_nw2),
            contentDescription = "Driving Tracker logo",
            modifier = Modifier.size(150.dp)
        )

        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 32.dp) //Adds space between the card and screen edges
                .padding(top = 10.dp), //Adds space between the card and logo
            colors = CardDefaults.cardColors(containerColor = Color.White),
            border = BorderStroke(1.dp, Color(0xFFE0E0E0)), //lifght grey border
            shape = RoundedCornerShape(8.dp)

        ) {
            Column (
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                horizontalAlignment = Alignment.Start
            ) {

                // Email Section
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {

                    Text(
                        text = "Email",
                        fontWeight = FontWeight.Medium,
                        fontSize = 14.sp
                    )
                    OutlinedTextField(
                        value = "",
                        onValueChange = {},
                        placeholder = { Text("Value", color = Color(0xFFBDBDBD)) },
                        modifier = Modifier.fillMaxWidth(),
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
                        value = "",
                        onValueChange = {},
                        placeholder = { Text("Value", color = Color(0xFFBDBDBD)) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp),
                        singleLine = true
                    )

                }

                //Sign In Button
                Button(
                    onClick = {},
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

@Composable
fun LoginScreen(viewModel: AuthViewModel = viewModel(), onSuccess: () -> Unit={}){

    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(uiState) { if (uiState is UiState.Success) onSuccess() }

    Login(
        uiState = uiState,
        onLogin = { identifier, password -> viewModel.login(identifier, password) }
    )
}

@Preview(showBackground=true, backgroundColor = 0xFFFFFFFF)
@Composable
fun LoginPreview(){
    DrivingTrackerTheme{
        Login()
    }
}