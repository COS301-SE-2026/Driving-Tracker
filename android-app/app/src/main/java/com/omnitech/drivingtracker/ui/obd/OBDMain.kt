package com.omnitech.drivingtracker.ui.obd
import com.omnitech.drivingtracker.ui.components.StandardScreen
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import androidx.navigation.NavController
import androidx.compose.material.icons.automirrored.filled.ArrowForwardIos
import com.omnitech.drivingtracker.Screen

@Composable
fun OBDMain(navController: NavController? =null){
    StandardScreen(
        navController = navController,
        title = "OBD Diagnostics",
        description = "Connect your OBD-|| adapter to view your vehicle health, fault codes, and live diagnostics.",
        bottomBarColor = "obd"
    ) {

            Spacer(modifier = Modifier.height(25.dp))

            //Different page options
            MenuCard("OBD Adapters") {navController?.navigate(Screen.OBDConnect.route) }
            Spacer(modifier = Modifier.height(25.dp))
            MenuCard("Key OBD data") {navController?.navigate(Screen.OBDKeyData.route) }
        }
}

@Composable
fun MenuCard(label: String, onClick:()->Unit){
    Card(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ){
        Column{
            MRow(label, onClick)
        }
    }
}
@Composable
fun MRow(label: String, onClick:()->Unit){
    Row(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick).padding(horizontal = 16.dp, vertical = 20.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ){
        Text(
            text = label,
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.SemiBold
        )
        Icon(
            imageVector = Icons.AutoMirrored.Filled.ArrowForwardIos,
            contentDescription = null,
            modifier = Modifier.size(16.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Preview(showBackground = true)
@Composable
fun OBDMainPreview() {
    DrivingTrackerTheme {
        OBDMain()
    }
}
