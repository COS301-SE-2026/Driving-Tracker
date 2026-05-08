package com.omnitech.drivingtracker.ui.auth
import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp


@Composable
fun SignUp(){
    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ){
        OutlinedTextField(
            value="",
            onValueChange={},
            label = {Text("First Name")},
            placeholder = {Text("First Name")}
        )
        OutlinedTextField(
            value = "",
            onValueChange={},
            label = {Text("Surname")},
            placeholder= {Text("Surname")}
        )
        OutlinedTextField(
            value="",
            onValueChange={},
            label = {Text("Email")},
            placeholder = {Text("Email")}
        )
        OutlinedTextField(
            value="",
            onValueChange={},
            label = {Text("Phone Number")},
            placeholder = {Text("Phone Number")}
        )
        Button(
            onClick = {}
        ){
            Text("Sign Up")
        }
    }
}
@Preview(showBackground=true)
@Composable
fun SignUpPreview(){
    DrivingTrackerTheme{
        SignUp()
    }
}