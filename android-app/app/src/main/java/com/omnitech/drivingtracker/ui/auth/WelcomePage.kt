package com.omnitech.drivingtracker.ui.auth
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
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
import com.omnitech.drivingtracker.ui.theme.*
import androidx.compose.ui.graphics.PaintingStyle.Companion.Stroke
import androidx.compose.ui.res.painterResource
import com.omnitech.drivingtracker.R

@Composable
fun WelcomePage(onLoginClick: () -> Unit = {}, onSignUpClick: () -> Unit = {}) {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        //The Logo
        Image(
            painter = painterResource(id = R.drawable.lg_nw2),
            contentDescription = "Driving Tracker logo",
            modifier = Modifier.size(280.dp)
        )

        //Text
        Column(
            modifier = Modifier.padding(bottom = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {

            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {

                Text(
                    text = "driving ",
                    color = Color.Black,
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Bold
                )


                Text(
                    text = "tracker",
                    color = Green,
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Bold
                )

            }

            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {

                Text(//slogan
                    text = "TRACK • ",
                    color = Blue,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    letterSpacing = 4.sp
                )

                Text(//slogan
                    text = "ANALYZE • ",
                    color = Purple,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    letterSpacing = 4.sp
                )

                Text(//slogan
                    text = "IMPROVE",
                    color = Green,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    letterSpacing = 4.sp
                )

            }


        }



        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 32.dp), //Space from screen edges
            horizontalArrangement = Arrangement.spacedBy(16.dp) //space between buttons
        ) {
            //Sign in button
            OutlinedButton(
                onClick = onLoginClick,
                modifier = Modifier.weight(1f), //Takes half the space
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Sign in", color = Color.Black)
            }

            //Register button
            Button(
                onClick = onSignUpClick,
                modifier = Modifier.weight(1f), //Takes half the space
                shape = RoundedCornerShape(8.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Green)
            ) {
                Text("Register", color = Color.White)
            }

        }
    }
}

@Preview(showBackground=true, backgroundColor = 0xFFFFFFFF)
@Composable
fun WelcomePreview(){
    DrivingTrackerTheme{
        WelcomePage()
    }
}