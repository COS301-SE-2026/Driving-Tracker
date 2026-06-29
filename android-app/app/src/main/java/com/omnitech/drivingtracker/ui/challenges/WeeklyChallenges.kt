package com.omnitech.drivingtracker.ui.challenges

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.LineHeightStyle
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import androidx.hilt.navigation.compose.hiltViewModel
import com.omnitech.drivingtracker.ui.achievements.AchievementsViewModel
import com.omnitech.drivingtracker.ui.components.TopBar
import com.omnitech.drivingtracker.ui.components.BottomNavBar
import com.omnitech.drivingtracker.ui.components.RankCard
import com.omnitech.drivingtracker.ui.components.ScoreRing
import com.omnitech.drivingtracker.ui.home.Dashboard
import com.omnitech.drivingtracker.ui.theme.*
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import androidx.compose.foundation.lazy.LazyRow

@Composable
fun WeeklyChallenges(navController: NavController? = null, viewModel: AchievementsViewModel = hiltViewModel()) {

    val state by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopBar(
                leftIcon = Icons.AutoMirrored.Filled.ArrowBack,
                rightIcon = Icons.Default.Settings,
                onLeftClick = { navController?.popBackStack() },
                onRightClick = { /*handle settings click*/ }
            )
        },
        bottomBar = {
            BottomNavBar(navController = navController, color = "none")
        }
    ) { paddingValues ->
        LazyColumn(
            modifier =  Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {

                   Card(//Ranks
                       modifier = Modifier.weight(1f),
                       colors = CardDefaults.cardColors(containerColor = CardWhite),
                       shape = RoundedCornerShape(12.dp),
                       elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
                   ) {
                        Column(
                            modifier = Modifier
                                .padding(16.dp)
                                .fillMaxWidth()
                        ) {
                            Text(
                                text = "Ranks",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(bottom = 8.dp)
                            )

                            when (val currentState = state) {

                                is AchievementsViewModel.UiState.Loading -> {
                                    Box(
                                        modifier = Modifier.fillMaxWidth().height(100.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        CircularProgressIndicator()
                                    }
                                }

                                is AchievementsViewModel.UiState.Error -> {
                                    Text(
                                        text = currentState.message ?: "Error loading",
                                        color = MaterialTheme.colorScheme.error,
                                        style = MaterialTheme.typography.bodySmall
                                    )
                                }

                                is AchievementsViewModel.UiState.Success -> {
                                    val leaderboard = currentState.leaderboard
                                    //We take top 3 entries
                                    leaderboard.entries.take(3).forEach { entry ->
                                        RankCard(
                                            name = entry.displayName,
                                            score = entry.score,
                                            isUser = entry.rank == leaderboard.myRank
                                        )
                                        HorizontalDivider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f))
                                    }

                                }
                                else -> {}
                            }

                        }
                   }

                    Card(//Sore
                        modifier = Modifier.weight(1f),
                        colors = CardDefaults.cardColors(containerColor = CardWhite),
                        shape = RoundedCornerShape(12.dp),
                        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
                    ) {
                        Box(
                            modifier = Modifier.padding(16.dp).fillMaxWidth(),
                            contentAlignment = Alignment.Center

                        ) {
                            /*Text(
                                text = "Score",
                                fontSize = 14.sp,
                                style = MaterialTheme.typography.bodyMedium
                            )*/
                            ScoreRing(score = 85, modifier = Modifier.size(100.dp))
                        }
                    }

                }
            }

            item{
                //This weeks challenges
            }

        }
    }

}

@Preview(showBackground = true)
@Composable
fun ChallengesPreview() {
    DrivingTrackerTheme {
        WeeklyChallenges()
    }
}