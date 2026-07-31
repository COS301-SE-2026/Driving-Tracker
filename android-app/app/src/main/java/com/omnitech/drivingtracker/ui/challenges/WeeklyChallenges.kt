//package com.omnitech.drivingtracker.ui.challenges
//
//import androidx.compose.foundation.layout.*
//import androidx.compose.foundation.lazy.LazyColumn
//import androidx.compose.foundation.lazy.items
//import androidx.compose.foundation.shape.RoundedCornerShape
//import androidx.compose.material.icons.Icons
//import androidx.compose.material.icons.automirrored.filled.ArrowBack
//import androidx.compose.material.icons.filled.Settings
//import androidx.compose.material3.*
//import androidx.compose.runtime.Composable
//import androidx.compose.runtime.collectAsState
//import androidx.compose.runtime.getValue
//import androidx.compose.ui.Alignment
//import androidx.compose.ui.Modifier
//import androidx.compose.ui.text.font.FontWeight
//import androidx.compose.ui.text.style.LineHeightStyle
//import androidx.compose.ui.tooling.preview.Preview
//import androidx.compose.ui.unit.dp
//import androidx.compose.ui.unit.sp
//import androidx.navigation.NavController
//import androidx.hilt.navigation.compose.hiltViewModel
//import com.omnitech.drivingtracker.ui.achievements.AchievementsViewModel
//import com.omnitech.drivingtracker.ui.components.TopBar
//import com.omnitech.drivingtracker.ui.components.BottomNavBar
//import com.omnitech.drivingtracker.ui.components.RankCard
//import com.omnitech.drivingtracker.ui.components.ScoreRing
//import com.omnitech.drivingtracker.ui.home.Dashboard
//import com.omnitech.drivingtracker.ui.theme.*
//import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
//import androidx.compose.foundation.lazy.LazyRow
//import androidx.compose.ui.graphics.Color
//import com.omnitech.drivingtracker.ui.components.ChallengeCard
//
//data class Challenge(
//    val id: String,
//    val title: String,
//    val description: String,
//    val currentProgress: Int,
//    val targetProgress: Int
//)
//@Composable
//fun WeeklyChallenges(
//    navController: NavController? = null,
//    viewModel: AchievementsViewModel = hiltViewModel(),
//    previewChallenges: List<Challenge>? = null //optional param to allow previewing mock data easily
//) {
//
//    val state by viewModel.uiState.collectAsState()
//
//    val mockChallenges = listOf(
//        Challenge("1", "Safety Officer", "Go 4 days without bad driving habits", 2, 4),
//        Challenge("2", "Speed Angel", "Complete 3 trips without going above the speed limit", 3, 3),
//        Challenge("3", "Throttle Goat", "Complete 5 trips without a hard acceleration alert", 2, 5)
//    )
//
//    WeeklyChallengesContent(
//        state = state,
//        challenges = mockChallenges,
//        navController = navController
//    )
//}
//
//@Composable
//fun WeeklyChallengesContent(
//    state: AchievementsViewModel.UiState,
//    challenges: List<Challenge>,
//    navController: NavController? = null
//) {
//    Scaffold(
//        topBar = {
//            TopBar(
//                leftIcon = Icons.AutoMirrored.Filled.ArrowBack,
//                rightIcon = Icons.Default.Settings,
//                onLeftClick = { navController?.popBackStack() },
//                onRightClick = { /*handle settings click*/ }
//            )
//        },
//        bottomBar = {
//            BottomNavBar(navController = navController, color = "none")
//        }
//    ) { paddingValues ->
//        LazyColumn(
//            modifier =  Modifier
//                .fillMaxSize()
//                .padding(paddingValues)
//                .padding(horizontal = 16.dp),
//            verticalArrangement = Arrangement.spacedBy(16.dp)
//        ) {
//            item {
//                Row(
//                    modifier = Modifier.fillMaxWidth(),
//                    horizontalArrangement = Arrangement.spacedBy(16.dp)
//                ) {
//
//                    Card(//Ranks
//                        modifier = Modifier
//                            .weight(1f)
//                            .height(200.dp),
//                        colors = CardDefaults.cardColors(containerColor = CardWhite),
//                        shape = RoundedCornerShape(12.dp),
//                        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
//                    ) {
//                        Column(
//                            modifier = Modifier
//                                .padding(16.dp)
//                                .fillMaxWidth()
//                        ) {
//                            Text(
//                                text = "Ranks",
//                                style = MaterialTheme.typography.titleMedium,
//                                fontWeight = FontWeight.Bold,
//                                modifier = Modifier.padding(bottom = 8.dp)
//                            )
//
//                            when (val currentState = state) {
//
//                                is AchievementsViewModel.UiState.Loading -> {
//                                    Box(
//                                        modifier = Modifier.fillMaxWidth().height(100.dp),
//                                        contentAlignment = Alignment.Center
//                                    ) {
//                                        CircularProgressIndicator()
//                                    }
//                                }
//
//                                is AchievementsViewModel.UiState.Error -> {
//                                    Text(
//                                        text = currentState.message ?: "Error loading",
//                                        color = MaterialTheme.colorScheme.error,
//                                        style = MaterialTheme.typography.bodySmall
//                                    )
//                                }
//
//                                is AchievementsViewModel.UiState.Success -> {
//                                    val leaderboard = currentState.leaderboard
//                                    //We take top 3 entries
//                                    leaderboard.entries.take(3).forEach { entry ->
//                                        RankCard(
//                                            name = entry.displayName,
//                                            score = entry.score,
//                                            isUser = entry.rank == leaderboard.myRank,
//                                            compact = true
//                                        )
//                                    }
//
//                                }
//
//                                else -> {}
//                            }
//
//                        }
//                    }
//
//                    Card(//Sore
//                        modifier = Modifier
//                            .weight(1f)
//                            .height(200.dp),
//                        colors = CardDefaults.cardColors(containerColor = CardWhite),
//                        shape = RoundedCornerShape(12.dp),
//                        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
//                    ) {
//                        Box(
//                            modifier = Modifier.padding(16.dp).fillMaxWidth(),
//                            contentAlignment = Alignment.Center
//
//                        ) {
//                            Column(
//                                modifier = Modifier
//                                    .padding(16.dp)
//                                    .fillMaxWidth()
//                            ) {
//                                Text(
//                                    text = "Score",
//                                    style = MaterialTheme.typography.titleMedium,
//                                    fontWeight = FontWeight.Bold,
//                                    modifier = Modifier.padding(bottom = 8.dp)
//                                )
//
//                                ScoreRing(score = 85, modifier = Modifier.size(100.dp))
//                            }
//                        }
//                    }
//
//                }
//            }
//
//            item {//This weeks challenges
//
//                Text(
//                    text = "This Week's Challenges",
//                    style = MaterialTheme.typography.titleMedium,
//                    fontWeight = FontWeight.Bold,
//                    modifier = Modifier.padding(vertical = 8.dp)
//                )
//
//            }
//            item {
//
//                Card(//container holding challenge cards
//                    modifier = Modifier.fillMaxWidth(),
//                    colors = CardDefaults.cardColors(containerColor = Color(0xFFE0E0E0)),
//                    shape = RoundedCornerShape(24.dp)
//                ) {
//                    Column(
//                        modifier = Modifier.padding(16.dp),
//                        verticalArrangement = Arrangement.spacedBy(16.dp)
//                    ) {
//
//                        challenges.forEach { challenge ->
//                            ChallengeCard(
//                                title = challenge.title,
//                                description = challenge.description,
//                                current = challenge.currentProgress,
//                                target = challenge.targetProgress
//                            )
//                        }
//
//                    }
//                }
//            }
//        }
//    }
//
//}
//
//@Preview(showBackground = true)
//@Composable
//fun ChallengesPreview() {
//    //list of mock challenges
//    val mockChallenges = listOf(
//        Challenge(
//            id = "1",
//            title = "Safety Officer",
//            description = "Go 4 days without bad driving habits",
//            currentProgress = 2,
//            targetProgress = 4
//        ),
//        Challenge(
//            id = "2",
//            title = "Speed Angel",
//            description = "Complete 2 trips without going above speed limit",
//            currentProgress = 2,
//            targetProgress = 2
//        ),
//        Challenge(
//            id = "1",
//            title = "Throttle Goat",
//            description = "Complete 5 trips without a hard acceleration alert",
//            currentProgress = 4,
//            targetProgress = 5
//        )
//    )
//
//    DrivingTrackerTheme {
//        WeeklyChallengesContent(
//            state = AchievementsViewModel.UiState.Success(
//                leaderboard = com.omnitech.drivingtracker.data.models.LeaderboardData(
//                   category = "OVERALL",
//                    scope = "WEEKLY",
//                    entries = listOf(
//                        com.omnitech.drivingtracker.data.models.LeaderboardEntry(1, "1", "Lesedi", 95.0),
//                        com.omnitech.drivingtracker.data.models.LeaderboardEntry(2, "2", "Mosa", 88.0),
//                        com.omnitech.drivingtracker.data.models.LeaderboardEntry(3, "3", "YOU", 85.0)
//                    ),
//                    myRank = 3,
//                    myScore = 85
//                )
//            ),
//            challenges = mockChallenges
//        )
//    }
//
//}