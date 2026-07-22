package com.omnitech.drivingtracker.ui.components
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.omnitech.drivingtracker.R
import androidx.compose.ui.Alignment
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.tooling.preview.Preview
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import androidx.compose.ui.text.font.*
import androidx.compose.ui.text.AnnotatedString

//Reusable for all permission related stuff

@Composable
fun Permissions(
    description: String,
    focus: String,
    onAllow: ()-> Unit,
    onDontAllow: ()-> Unit
){
    Card(
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(10.dp)
    ){
        Column(
            modifier = Modifier.fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {

            //Logo
            Image(
                painter = painterResource(id = R.drawable.lg_nw2),
                contentDescription = "Driving Tracker logo",
                modifier = Modifier.size(280.dp)
            )

            //Description
            Text(
                text = boldedDescription(description, focus),
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 16.dp, bottom = 24.dp),
                fontWeight = FontWeight.Normal
            )

            //Allow/Disallow
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedButton(
                    onClick = onDontAllow,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.outlinedButtonColors(containerColor = Color.White,
                        contentColor = MaterialTheme.colorScheme.primary),
                    border = BorderStroke(1.5.dp, MaterialTheme.colorScheme.primary)
                ) {
                    Text("Don't allow")
                }
                Button(
                    onClick = onAllow,
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Allow")
                }
            }
        }
    }
}

private fun boldedDescription(description: String, focus: String): AnnotatedString{
    val startIndex = description.indexOf(focus)
    return buildAnnotatedString {
        if (startIndex == -1){
            //no focused permission so description will be plain
            append(description)
        }else{
            append(description.substring(0,startIndex))
            withStyle(SpanStyle(fontWeight = FontWeight.Bold)){
                append(focus)
            }
            append(description.substring(startIndex + focus.length))
        }
    }
}

@Preview(showBackground = true)
@Composable
fun PermissionsPreview() {
    DrivingTrackerTheme {
        Permissions(description = "Allow Bluetooth to find, connect to, and determine the relative position of nearby devices?",focus = "Bluetooth", onAllow = {}, onDontAllow = {})
    }
}