package com.omnitech.drivingtracker.ui.components
import com.omnitech.drivingtracker.R
import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import java.util.Locale

@Composable
fun MinimizedTrip(
    distance: Double,
    arrivalTime: String,
    onExpandClick: () -> Unit
){
    Card(
        modifier = Modifier.fillMaxWidth()
            .clickable(onClick = onExpandClick)
            .padding(horizontal = 16.dp, vertical = 8.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ){
        Row(
            modifier = Modifier.fillMaxWidth()
                .padding(horizontal = 24.dp, vertical = 18.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ){
            Row(horizontalArrangement = Arrangement.spacedBy(30.dp)) {
                StatColumn(value = arrivalTime, label = "min")
                StatColumn(value = String.format(Locale.getDefault(), "%.1f", distance),
                    label = "km")
            }
            //Logo
            Image(
                painter = painterResource(id = R.drawable.sadlogo),
                contentDescription = "Sad Driving Tracker logo",
                modifier = Modifier.size(90.dp)
            )
            //Go back to trip
            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = null,
                tint = Color.Black,
                modifier = Modifier.size(40.dp)
            )
        }
    }
}

@Composable
private fun StatColumn(value: String, label: String){
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ){
        Text(
            text = value,
            fontWeight = FontWeight.Bold,
            style = MaterialTheme.typography.headlineMedium
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall, color = Color.DarkGray
        )
    }
}

@Preview(showBackground = true)
@Composable
fun MinimizedTripPreview(){
    DrivingTrackerTheme{
        MinimizedTrip(distance = 10.52, arrivalTime = "2",onExpandClick = {})
    }
}