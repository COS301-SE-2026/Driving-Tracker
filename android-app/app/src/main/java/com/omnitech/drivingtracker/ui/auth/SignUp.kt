package com.omnitech.drivingtracker.ui.auth
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
import com.omnitech.drivingtracker.ui.theme.Green
import androidx.compose.ui.graphics.PaintingStyle.Companion.Stroke
import androidx.lifecycle.viewmodel.compose.viewModel


@Composable
fun SignUp(uiState: AuthViewModel.UiState = AuthViewModel.UiState.Idle,
           onRegister: (String, String, String, String, String, Boolean) -> Unit = { _, _, _, _, _, _ -> }){

    var name by remember { mutableStateOf("") }
    var surname by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("")}
    var consentStatus by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier.fillMaxSize().padding(horizontal = 24.dp),
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
                modifier = Modifier.fillMaxWidth().padding(20.dp),
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
                        value=name,
                        onValueChange={ name=it },
                        placeholder = {Text("First Name", color=Color.LightGray)},
                        modifier = Modifier.fillMaxWidth().height(50.dp),
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
                        value=surname,
                        onValueChange={ surname=it},
                        placeholder = {Text("Surname", color=Color.LightGray)},
                        modifier = Modifier.fillMaxWidth().height(50.dp),
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
                        value=email,
                        onValueChange={ email=it },
                        placeholder = {Text("Email", color=Color.LightGray)},
                        modifier = Modifier.fillMaxWidth().height(50.dp),
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
                        value="",
                        onValueChange={},
                        placeholder = {Text("Phone Number", color=Color.LightGray)},
                        modifier = Modifier.fillMaxWidth().height(50.dp),
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
                        value=password,
                        onValueChange={ password=it },
                        placeholder = {Text("Password", color=Color.LightGray)},
                        modifier = Modifier.fillMaxWidth().height(50.dp),
                        shape = RoundedCornerShape(8.dp),
                        singleLine = true
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
                        value=confirmPassword,
                        onValueChange={ confirmPassword=it },
                        placeholder = {Text("Confirm Password", color=Color.LightGray)},
                        modifier = Modifier.fillMaxWidth().height(50.dp),
                        shape = RoundedCornerShape(8.dp),
                        singleLine = true
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
                        modifier = Modifier.fillMaxWidth().height(50.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ){
                        OutlinedTextField(
                            value = "",
                            onValueChange = {},
                            placeholder = {Text("DD", color = Color.LightGray)},
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp),
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = "",
                            onValueChange = {},
                            placeholder = {Text("MM", color = Color.LightGray)},
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp),
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = "",
                            onValueChange = {},
                            placeholder = {Text("YYYY", color = Color.LightGray)},
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp),
                            singleLine = true
                        )
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))

                Button(
                    onClick = {
                        onRegister(
                            username,
                            name,
                            surname,
                            email,
                            password,
                            consentStatus
                        )
                    },
                    modifier = Modifier.fillMaxWidth().height(50.dp),
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
fun SignUpScreen(viewModel: AuthViewModel = viewModel(), onSuccess: () -> Unit={}){

    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(uiState) { if (uiState is AuthViewModel.UiState.Success) onSuccess() }

    SignUp(
        uiState = uiState,
        onRegister = { username, name, surname, email, password, consent ->
            viewModel.register(username, name, surname, email, password, consent)
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