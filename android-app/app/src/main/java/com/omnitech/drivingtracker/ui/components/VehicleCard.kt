package com.omnitech.drivingtracker.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.MoreHoriz
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.omnitech.drivingtracker.ui.obd.Vehicle

@Composable
fun VehicleCard(
    vehicle: Vehicle,
    onDrivingInfoClick: () -> Unit
) {

    var showMenu by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFE5E5E5))
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.Top
        ){
            Box(
                modifier = Modifier
                    .size(100.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color.White),
                contentAlignment = Alignment.Center
            ){//Vehicle image box

                if (vehicle.imageRes != null) {
                    Image(
                        painter = painterResource(id = vehicle.imageRes),
                        contentDescription = null,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                } else{
                    Icon(
                        imageVector = Icons.Default.Image,
                        contentDescription = null,
                        modifier = Modifier.size(48.dp),
                        tint = Color.LightGray
                    )
                }

            }

            Spacer(modifier = Modifier.width(16.dp))

            //Vehicle text Info
            Column(modifier = Modifier.weight(1.0f)){

                Text(
                    text = vehicle.alias,
                    style = MaterialTheme.typography.headlineMedium
                )

                Spacer(modifier = Modifier.width(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ){

                    Text(text = vehicle.brand, style = MaterialTheme.typography.bodyMedium)

                    //Formatting mileage with spaces as thousands separator
                    Text(
                        text = "${String.format("%,d", vehicle.mileage).replace(',', ' ')}km",
                        style = MaterialTheme.typography.titleMedium
                    )

                }

                Text(text = vehicle.model, style = MaterialTheme.typography.bodyMedium)

            }

            //Three dots menu
            Box{

                IconButton(onClick = { showMenu = true }) {
                    Icon(imageVector = Icons.Default.MoreHoriz, contentDescription = "Options")
                }

                DropdownMenu(
                    expanded = showMenu,
                    onDismissRequest = { showMenu = false },
                    modifier = Modifier.background(Color.White).clip(RoundedCornerShape(8.dp))
                ) {

                    DropdownMenuItem(
                        text = { Text("Edit Alias", modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center) },
                        onClick = { showMenu = false }//Need to work on this
                    )

                    HorizontalDivider(modifier = Modifier.padding(horizontal = 8.dp))

                    DropdownMenuItem(
                        text = { Text("Driving Info", modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center) },
                        onClick = {
                            showMenu = false
                            onDrivingInfoClick()
                        }
                    )

                    HorizontalDivider(modifier = Modifier.padding(horizontal = 8.dp))

                    DropdownMenuItem(
                        text = { Text("Disconnect", modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center) },
                        onClick = { showMenu = false }//Need to work on this
                    )

                }

            }

        }
    }

}