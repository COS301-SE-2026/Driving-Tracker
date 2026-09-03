package com.omnitech.drivingtracker.ui.analytics

import android.R
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowBackIosNew
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.omnitech.drivingtracker.Screen
import com.omnitech.drivingtracker.ui.components.RankCard
import com.omnitech.drivingtracker.ui.components.TopBar
import com.omnitech.drivingtracker.ui.theme.*
import java.nio.file.WatchEvent

@Composable
fun FuelComparisonScreen(
    navController: NavController,
    viewModel: FuelComparisonViewModel = hiltViewModel()
) {

    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopBar(
                leftIcon = Icons.Default.ArrowBackIosNew,
                rightIcon = Icons.Default.Settings,
                onLeftClick = {navController?.popBackStack() },
                onRightClick = { navController?.navigate(Screen.Settings.route) }
            )
        }
    ) { paddingValues ->

        Box(modifier = Modifier.fillMaxSize().padding(paddingValues)) {

            when (val state = uiState) {
                is FuelComparisonUiState.Loading -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                }
                is FuelComparisonUiState.Error -> {
                    Text(state.message, color = Error, modifier = Modifier.align(Alignment.Center))
                }
                is FuelComparisonUiState.Success -> {
                    FuelComparisonContent(state)
                }
            }

        }

    }

}

@Composable
private fun FuelComparisonContent(state: FuelComparisonUiState.Success) {

    val data = state.data
    val statusColor = if (state.isBeatingStandard) Green else Error

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {

        item {
            Spacer(modifier = Modifier.height(8.dp))
            Text("Vehicle Specifications", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        }

        //Top Card: Vehicle Details
        item {

            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = CardWhite),
                elevation = CardDefaults.cardElevation(4.dp)
            ) {

                Column(modifier = Modifier.padding(16.dp)) {

                    Text(
                        "${data.vehicle.make} ${data.vehicle.model}",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold
                    )

                    Text(
                        "Year: ${data.vehicle.year} | Fuel: ${data.vehicle.fuelType}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondary
                    )

                }

            }

        }

        //Comparison Section
        item {

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {

                //Manufacturer Standard
                ComparisonCard(
                    label = "Benchmark",
                    value = data.manufacturerStandard,
                    modifier = Modifier.weight(1f)
                )

                //User average with border that changes color
                ComparisonCard(
                    label = "Your Average",
                    value = data.userAverage,
                    borderColor = statusColor,
                    modifier = Modifier.weight(1f)
                )

            }

        }

        //Leaderboard Section
        item {

            Text(
                "Peer Leaderboard ${data.vehicle.model}",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(top = 8.dp)
            )

        }

        items(data.peerLeaderboard) { peer ->

            RankCard(
                name = peer.displayName,
                score = peer.efficiency,
                isUser = peer.displayName == "YOU",
                compact = false
            )
            HorizontalDivider(color = Border, thickness = 0.5.dp)
        }

    }

}

@Composable
private fun ComparisonCard(
    label: String,
    value: Double,
    modifier: Modifier = Modifier,
    borderColor: Color? = null
) {

    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = CardWhite),
        border = borderColor?.let { BorderStroke(2.dp, it) },
        elevation = CardDefaults.cardElevation(2.dp)
    ) {

        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {

            Text(
                label,
                style = MaterialTheme.typography.labelMedium,
                color = TextSecondary
            )

            Text(
                String.format("%.1f", value),
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = borderColor ?: Blue
            )

            Text(
                "L/100km",
                style = MaterialTheme.typography.labelSmall,
            )
        }

    }

}