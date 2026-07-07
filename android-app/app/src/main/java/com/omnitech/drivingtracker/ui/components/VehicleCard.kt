package com.omnitech.drivingtracker.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
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

        ){
            Box(){//Vehicle image box

            }

            Spacer(modifier = Modifier.width(16.dp))

            //Vehicle text Info
            Column(){

            }

            //Three dots menu
            Box{

            }

        }
    }

}