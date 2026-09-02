package com.omnitech.drivingtracker.ui.components

import android.app.Dialog
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.window.Dialog
import com.omnitech.drivingtracker.ui.obd.Vehicle
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Image
import androidx.compose.ui.Alignment
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.style.LineHeightStyle
import androidx.compose.ui.unit.dp
import com.omnitech.drivingtracker.R
import com.omnitech.drivingtracker.ui.components.VehicleStatItem
import com.omnitech.drivingtracker.ui.theme.*

@Composable
fun VehicleInfoCard(
    vehicle: Vehicle,
    onDismiss: () -> Unit
) {

    Dialog(onDismissRequest = onDismiss) {

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFFE5E5E5))
        ) {

            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {

                Text(
                    text = "${vehicle.name}'s stats",
                    style = MaterialTheme.typography.headlineMedium,
                    modifier = Modifier.align(Alignment.Start)
                )

                Spacer(modifier = Modifier.height(16.dp))

                //Car Image
                VehicleImage(
                    imageRes = vehicle.imageRes,
                    imageUri = vehicle.imageUri,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp)
                        .clip(RoundedCornerShape(20.dp))
                )

                Spacer(modifier = Modifier.height(24.dp))

                //Stats Grid Layout
                Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {

                    Row(modifier = Modifier.fillMaxWidth()) {

                        VehicleStatItem(//Mileage
                            iconPainter = painterResource(id = R.drawable.stats_time),
                            tint = Blue,
                            label = "Mileage",
                            value = "${vehicle.mileage} km",
                            modifier = Modifier.weight(1f)
                        )

                        VehicleStatItem(//trips
                            iconPainter = painterResource(id = R.drawable.stats_distance),
                            label = "Trips",
                            tint = Blue,
                            value = "${vehicle.trips}",
                            modifier = Modifier.weight(1f)
                        )

                    }

                    Row(modifier = Modifier.fillMaxWidth()) {

                        VehicleStatItem(//Efficiency
                            iconPainter = painterResource(id = R.drawable.stats_fuel),
                            label = "Fuel Efficiency",
                            tint = if (vehicle.fuelEfficiency >= 12.0) Green else Error,
                            value = "${vehicle.fuelEfficiency} km/l",
                            modifier = Modifier.weight(1f)
                        )

                        VehicleStatItem(//Needs service?
                            iconPainter = painterResource(id = R.drawable.stats_service),
                            label = "Needs Service?",
                            tint = if (vehicle.needsService) Error else Green,
                            value = if (vehicle.needsService) "YES" else "No",
                            modifier = Modifier.weight(1f),
                            tooltipText = "Alerts every 15,000 Km. You have a 500 Km buffer to service before" +
                                    " the alert resets for the next interval."
                        )

                    }

                }

            }

        }

    }

}