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
import com.omnitech.drivingtracker.ui.achievements.AchievementsUiState
import com.omnitech.drivingtracker.ui.achievements.Challenge
import com.omnitech.drivingtracker.ui.components.TopBar
import com.omnitech.drivingtracker.ui.components.BottomNavBar
import com.omnitech.drivingtracker.ui.components.RankCard
import com.omnitech.drivingtracker.ui.components.ScoreRing
import com.omnitech.drivingtracker.ui.home.Dashboard
import com.omnitech.drivingtracker.ui.theme.*
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.ui.graphics.Color
import com.omnitech.drivingtracker.ui.components.ChallengeCard

@Composable
fun WeeklyChallenges(
    navController: NavController? = null,
    viewModel: AchievementsViewModel = hiltViewModel(),
) {

    val state by viewModel.uiState.collectAsState()

    WeeklyChallengesContent(
        state = state,
        challenges = state.challenges,
        navController = navController
    )
}

@Composable
fun WeeklyChallengesContent(
    state: AchievementsUiState,
    challenges: List<Challenge>,
    navController: NavController? = null
) {
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
                        modifier = Modifier
                            .weight(1f)
                            .height(200.dp),
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

                            if (state.isLoadingLeaderboard) {
                                Box(
                                    modifier = Modifier.fillMaxWidth().height(100.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    CircularProgressIndicator()
                                }
                            } else if (state.error != null) {
                                Text(
                                    text = state.error,
                                    color = MaterialTheme.colorScheme.error,
                                    style = MaterialTheme.typography.bodySmall
                                )
                            } else {
                                state.leaderboard?.let { leaderboard ->
                                    leaderboard.entries.take(3).forEach { entry ->
                                        RankCard(
                                            name = entry.displayName,
                                            score = entry.score,
                                            isUser = entry.rank == leaderboard.myRank,
                                            compact = true
                                        )
                                    }
                                }
                            }

                        }
                    }

                    Card(//Sore
                        modifier = Modifier
                            .weight(1f)
                            .height(200.dp),
                        colors = CardDefaults.cardColors(containerColor = CardWhite),
                        shape = RoundedCornerShape(12.dp),
                        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
                    ) {
                        Box(
                            modifier = Modifier.padding(16.dp).fillMaxWidth(),
                            contentAlignment = Alignment.Center

                        ) {
                            Column(
                                modifier = Modifier
                                    .padding(16.dp)
                                    .fillMaxWidth()
                            ) {
                                Text(
                                    text = "Score",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(bottom = 8.dp)
                                )

                                ScoreRing(score = state.overallScore, modifier = Modifier.size(100.dp))
                            }
                        }
                    }

                }
            }

            item {//This weeks challenges

                Text(
                    text = "This Week's Challenges",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(vertical = 8.dp)
                )

            }
            item {

                Card(//container holding challenge cards
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFE0E0E0)),
                    shape = RoundedCornerShape(24.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {

                        if (challenges.isEmpty()) {
                            Text("No active challenges.", modifier = Modifier.padding(8.dp))
                        } else {
                            challenges.forEach { challenge ->
                                ChallengeCard(
                                    title = challenge.title,
                                    description = challenge.description,
                                    current = challenge.currentProgress,
                                    target = challenge.targetProgress
                                )
                            }
                        }

                    }
                }
            }
        }
    }

}

@Preview(showBackground = true)
@Composable
fun ChallengesPreview() {
    //list of mock challenges
    val mockChallenges = listOf(
        Challenge(
            id = "1",
            title = "Safety Officer",
            description = "Go 4 days without bad driving habits",
            currentProgress = 2,
            targetProgress = 4
        ),
        Challenge(
            id = "2",
            title = "Speed Angel",
            description = "Complete 2 trips without going above speed limit",
            currentProgress = 2,
            targetProgress = 2
        )
    )

    DrivingTrackerTheme {
        WeeklyChallengesContent(
            state = AchievementsUiState(
                leaderboard = com.omnitech.drivingtracker.data.models.LeaderboardData(
                   category = "OVERALL",
                    scope = "WEEKLY",
                    entries = listOf(
                        com.omnitech.drivingtracker.data.models.LeaderboardEntry(1, "1", "Lesedi", 95.0),
                        com.omnitech.drivingtracker.data.models.LeaderboardEntry(2, "2", "Mosa", 88.0),
                        com.omnitech.drivingtracker.data.models.LeaderboardEntry(3, "3", "YOU", 85.0)
                    ),
                    myRank = 3,
                    myScore = 85.0
                ),
                overallScore = 85
            ),
            challenges = mockChallenges
        )
    }

}