package com.omnitech.drivingtracker.ui.auth
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.platform.testTag


@Composable
fun WelcomePage(onLoginClick: () -> Unit = {}, onSignUpClick: () -> Unit = {}) {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        //Text
        Column(
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

        Spacer(modifier = Modifier.height(50.dp))

        //The Logo
        Image(
            painter = painterResource(id = R.drawable.lg_main),
            contentDescription = "Driving Tracker logo",
            modifier = Modifier.size(280.dp)
        )

        Spacer(modifier = Modifier.height(40.dp))

        //Sign In button
        Button(
            onClick = onLoginClick,
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp)
                .padding(horizontal = 30.dp)
                .testTag("welcomeLoginButton"),
            shape = RoundedCornerShape(8.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Green)
        ) {
            Text("Sign In", color = Color.White)
        }

        Spacer(modifier = Modifier.height(18.dp))

        //Register link
        Row(
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {

            Text(
                text = "Don't have an account? ",
                style = MaterialTheme.typography.titleSmall
            )

            Text(
                text = "Register",
                color = Blue,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.clickable { onSignUpClick() }.testTag("welcomeSignupLink")
            )

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