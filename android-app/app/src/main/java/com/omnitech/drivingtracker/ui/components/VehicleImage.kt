package com.omnitech.drivingtracker.ui.components

import androidx.compose.material3.Icon
import androidx.compose.foundation.Image
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.*
import androidx.compose.foundation.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Image
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import coil.compose.AsyncImage

//Reusable image loader
@Composable
fun VehicleImage(
    imageRes: Int?,
    imageUri: String?,
    modifier: Modifier = Modifier
) {

    if (!imageUri.isNullOrEmpty()) {
        AsyncImage(
            model = imageUri,
            contentDescription = null,
            contentScale = ContentScale.Crop,
            modifier = modifier
        )
    } else if (imageRes != null) {
        Image(
            painter = painterResource(id = imageRes),
            contentDescription = null,
            contentScale = ContentScale.Crop,
            modifier = modifier
        )
    } else {
        Icon(
            imageVector = Icons.Default.Image,
            contentDescription = null,
            modifier = modifier,
            tint = Color.LightGray
        )
    }

}