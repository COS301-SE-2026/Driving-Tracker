package com.omnitech.drivingtracker.ui.auth

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.omnitech.drivingtracker.ui.auth.AuthViewModel.UiState
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import com.omnitech.drivingtracker.ui.theme.Green

@Composable
fun SignUp(
    uiState: UiState = UiState.Idle,
    onRegister: (String, String, String, String, String, String, String, String, String, String, Boolean) -> Unit = { _, _, _, _, _, _, _, _, _, _, _ -> }
) {

    var name by remember { mutableStateOf("") }
    var surname by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var phoneNumber by remember { mutableStateOf("") }
    var day by remember { mutableStateOf("") }
    var month by remember { mutableStateOf("") }
    var year by remember { mutableStateOf("") }
    var consent_status by remember { mutableStateOf(false) }

    var passwordVisible by remember { mutableStateOf(false)}
    var confirmPasswordVisible by remember { mutableStateOf(false)}

    val errorCode = (uiState as? UiState.Error)?.code
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ){

        Text(
            text = "Sign Up",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            fontSize = 24.sp,
            color = Green
        )
        Spacer(modifier = Modifier.height(24.dp))

        //Sign Up part
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ){
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ){
                //Columns for all fields
                Column{
                    Text(
                        text = "First Name",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        placeholder = { Text("First Name", color = Color.LightGray) },
                        isError = errorCode == "INVALID_NAME",
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        shape = RoundedCornerShape(8.dp),
                        singleLine = true
                    )
                }
                Column{
                    Text(
                        text = "Surname",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    OutlinedTextField(
                        value = surname,
                        onValueChange = { surname = it },
                        placeholder = { Text("Surname", color = Color.LightGray) },
                        isError = errorCode == "INVALID_SURNAME",
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        shape = RoundedCornerShape(8.dp),
                        singleLine = true
                    )
                }
                Column{
                    Text(
                        text = "Email",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        placeholder = { Text("Email", color = Color.LightGray) },
                        isError = errorCode == "INVALID_EMAIL",
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        shape = RoundedCornerShape(8.dp),
                        singleLine = true
                    )
                }
                Column{
                    Text(
                        text = "Phone Number",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    OutlinedTextField(
                        value = phoneNumber,
                        onValueChange = { phoneNumber = it },
                        placeholder = { Text("Phone Number", color = Color.LightGray) },
                        isError = errorCode == "INVALID_PHONE",
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        shape = RoundedCornerShape(8.dp),
                        singleLine = true
                    )
                }
                Column{
                    Text(
                        text = "Password",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        placeholder = { Text("Password", color = Color.LightGray) },
                        isError = errorCode == "INVALID_PASSWORD",
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
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
                Column{
                    Text(
                        text = "Confirm Password",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    OutlinedTextField(
                        value = confirmPassword,
                        onValueChange = { confirmPassword = it },
                        placeholder = { Text("Confirm Password", color = Color.LightGray) },
                        isError = errorCode == "INVALID_CONFIRM",
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        shape = RoundedCornerShape(8.dp),
                        singleLine = true,
                        visualTransformation = if (confirmPasswordVisible) VisualTransformation.None
                        else PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                        trailingIcon = {
                            val image = if (confirmPasswordVisible)
                                Icons.Filled.Visibility
                            else Icons.Filled.VisibilityOff

                            val description = if (confirmPasswordVisible) "Hide password" else "Show password"

                            IconButton(onClick = {
                                confirmPasswordVisible = !confirmPasswordVisible
                            }) {
                                Icon(imageVector = image, contentDescription = description)
                            }
                        }
                    )
                }
                Column{
                    Text(
                        text = "Date of Birth",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ){
                        OutlinedTextField(
                            value = day,
                            onValueChange = {
                                if (it.length<=2 && it.all{char -> char.isDigit()}) day=it
                            },
                            placeholder = {Text("DD", color = Color.LightGray)},
                            isError = errorCode == "INVALID_DAY",
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp),
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                        )
                        OutlinedTextField(
                            value = month,
                            onValueChange = {
                                if (it.length <= 2 && it.all { char -> char.isDigit() }) month = it
                            },
                            placeholder = {Text("MM", color = Color.LightGray)},
                            isError = errorCode == "INVALID_MONTH",
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp),
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                        )
                        OutlinedTextField(
                            value = year,
                            onValueChange = {
                                if (it.length<=4 && it.all{char -> char.isDigit()}) year=it
                            },
                            placeholder = {Text("YYYY", color = Color.LightGray)},
                            isError = errorCode == "INVALID_YEAR",
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp),
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                        )

                    }
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Checkbox(
                        checked = consent_status,
                        onCheckedChange = { consent_status = it }
                    )
                    Text(
                        text = "I agree to the terms and conditions",
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.clickable { consent_status = !consent_status }
                    )
                }

                if (uiState is UiState.Error) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(min = 10.dp, max = 15.dp)
                    ) {
                        Text(
                            text = uiState.message,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.error,
                            modifier = Modifier.fillMaxWidth(),
                            textAlign = TextAlign.Center
                        )
                    }
                }

                Button(
                    onClick = {
                            username = "$name $surname"
                            onRegister(
                                username,
                                name,
                                surname,
                                email,
                                password,
                                confirmPassword,
                                phoneNumber,
                                day,
                                month,
                                year,
                                consent_status
                            )
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Green, contentColor = Color.White)
                ){
                    Text("Sign Up",fontWeight= FontWeight.Bold, fontSize=16.sp, color = Color.White)
                }

            }
        }
    }
}

@Composable
fun SignUpScreen(
    viewModel: AuthViewModel = viewModel(),
    onSignUpSuccess: () -> Unit = {},
    onBackClick: () -> Unit = {}
){

    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(uiState) { if (uiState is AuthViewModel.UiState.Success) onSignUpSuccess() }

    SignUp(
        uiState = uiState,
        onRegister = { username, name, surname, email, password, confirmPassword, phoneNumber, day, month, year, consent ->
            viewModel.register(username, name, surname, email, password,confirmPassword,phoneNumber, day, month, year,consent)
        }
    )
}

    @Preview(showBackground=true)
    @Composable
    fun SignUpPreview(){
        DrivingTrackerTheme{
            SignUp()
        }
    }

    @Preview(showBackground = true, name = "Signup Error View")
    @Composable
    fun SignUpErrorPreview() {
        DrivingTrackerTheme {
            SignUp(uiState = UiState.Error(code = "INVALID_EMAIL", message = "Email field is required"))
        }
    }

