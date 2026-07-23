package com.omnitech.drivingtracker.ui.obd
import com.omnitech.drivingtracker.ui.components.StandardScreen

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import androidx.navigation.NavController
import androidx.compose.ui.Alignment

data class LiveWarning(
    val title: String,
    val description: String,
)

@Composable
fun OBDLiveWarnings(navController: NavController? =null){

    val engineLightWarning = "Check Engine/Malfunction indicator Lamp (MIL)"
    val fuelTrimWarning = "Indicates the engine is getting too much air and not enough fuel."
    //mock warnings
    val warnings = remember{
        listOf(
            LiveWarning(
                title = engineLightWarning,
                description = fuelTrimWarning
            ),
            LiveWarning(
                title = engineLightWarning,
                description = fuelTrimWarning
            ),
            LiveWarning(
                title = engineLightWarning,
                description = fuelTrimWarning
            )

        )
    }

    StandardScreen(
        navController = navController,
        title = "Live Warnings",
        description = "Monitor incoming diagnostics"
    ) {
            Spacer(modifier = Modifier.height(14.dp))

            //No warnings
            if (warnings.isEmpty()){
                Box(
                    modifier = Modifier.fillMaxWidth().padding(top = 64.dp),
                    contentAlignment = Alignment.Center
                ){
                    Text(
                        text = "No Live Warnings available",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                }
            }
            else{
                warnings.forEach{
                    warning->WarningCard(warning = warning)
                    Spacer(modifier = Modifier.height(14.dp))
                }
            }
        }
}

@Composable
fun WarningCard(warning: LiveWarning){
    Card(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ){
        Column(
            modifier = Modifier.padding(16.dp)
        ){
            Text(
                text = warning.title,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodyMedium
            )

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Bottom
            ){
                Text(
                    text = warning.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onBackground,
                    modifier = Modifier.weight(1f)
                )

                Spacer(modifier = Modifier.width(8.dp))

                Text(
                    text = "See more",
                    style = MaterialTheme.typography.bodySmall,
                    fontWeight = FontWeight.SemiBold,
                    color = Color.Blue
                )
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun OBDLiveWarningsPreview() {
    DrivingTrackerTheme {
        OBDLiveWarnings()
    }
}