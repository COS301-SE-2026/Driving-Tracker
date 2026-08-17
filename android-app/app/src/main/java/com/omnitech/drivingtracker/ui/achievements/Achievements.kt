package com.omnitech.drivingtracker.ui.achievements

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.unit.dp
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.omnitech.drivingtracker.ui.theme.*
import androidx.compose.ui.graphics.PaintingStyle.Companion.Stroke
import com.omnitech.drivingtracker.ui.components.BottomNavBar
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBackIosNew
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Tune
import androidx.compose.ui.res.painterResource
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.viewmodel.compose.viewModel
import com.omnitech.drivingtracker.R
import com.omnitech.drivingtracker.ui.components.BadgeSection
import com.omnitech.drivingtracker.ui.components.RankCard
import com.omnitech.drivingtracker.ui.components.ScoreCard
import com.omnitech.drivingtracker.ui.components.TopBar
import com.omnitech.drivingtracker.ui.home.Dashboard


import androidx.navigation.NavController
import com.omnitech.drivingtracker.Screen
import com.omnitech.drivingtracker.ui.components.BadgeDescriptionDialog
import com.omnitech.drivingtracker.ui.components.BadgeGalleryDialog

@Composable
fun AchievementsScreen(
    navController: NavController? = null,
    viewModel: AchievementsViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()
    var showGallery by remember { mutableStateOf(false) }
    var selectedBadge by remember { mutableStateOf<BadgeUiModel?>(null) }
    AchievementsContent(
        state = state,
        navController = navController,
        onViewMore = { showGallery = true },
        onBadgeClick = { selectedBadge = it },
        onChallengesClick = { navController?.navigate(Screen.WeeklyChallenges.route) },
        onFilterChanged = {category, scope ->
            viewModel.getLeaderboard(category, scope)
        }
    )

    if (showGallery) BadgeGalleryDialog(
        badges = state.badges,
        completedChallenges = state.badges.count { it.isEarned },
        onDismiss = { showGallery = false },
        onBadgeClick = {
            selectedBadge = it
            showGallery = false
        }
    )
    selectedBadge?.let { badge ->
        BadgeDescriptionDialog(badge = badge, onDismiss = { selectedBadge = null })
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AchievementsContent(
    state: AchievementsUiState,
    navController: NavController? = null,
    onViewMore: () -> Unit = {},
    onBadgeClick: (BadgeUiModel) -> Unit = {},
    onChallengesClick: () -> Unit = {},
    onFilterChanged: (category: String, scope: String) -> Unit = {_, _ -> }
) {
    var expandedCategory by remember { mutableStateOf(false) }
    var expandedScope by remember { mutableStateOf(false) }
    var selectedCategory by remember {mutableStateOf("OVERALL")}
    var selectedScope by remember {mutableStateOf("WEEKLY")}
//    var categories by remember {mutableStateOf(emptyList<String>())}
//    var scopes by remember {mutableStateOf(emptyList<String>())}

//    LaunchedEffect(state){
//
//        if (state is AchievementsViewModel.UiState.Success) {
//            categories = state.categories
//            scopes = state.scopes
//        }
//    }

    Scaffold(
        topBar = {
            TopBar(
                leftIcon = Icons.Default.ArrowBackIosNew,
                rightIcon = Icons.Default.Settings,
                onLeftClick = {navController?.popBackStack() },
                onRightClick = { navController?.navigate(Screen.Settings.route) }
            )
        },

        bottomBar = {
            BottomNavBar(navController = navController, color = "ach")
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp, vertical = 24.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            item {
                //Overal Driving score
                ScoreCard(score = state.overallScore)
            }

            item {
                // Badges Gallery (LazyRow)
                BadgeSection(
                    badges = state.badges,
                    onViewMore = onViewMore,
                    onBadgeClick = onBadgeClick
                )
            }

            item {//Navigation to Weekly Challenges
                Button(
                    onClick = onChallengesClick,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Blue)
                ){
                    Text("View Weekly Challenges")
                }
            }

            item {
                Text(
                    text = "Ranks",
                    style = MaterialTheme.typography.titleMedium
                )
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 3.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    ExposedDropdownMenuBox(
                        expanded = expandedCategory,
                        onExpandedChange = { expandedCategory = !expandedCategory },
                        modifier = Modifier.width(150.dp).height(56.dp)
                    ) {
                        OutlinedTextField(
                            value = selectedCategory.replace('_',' ')
                                .lowercase()
                                .replaceFirstChar { it.uppercase() },
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Category") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedCategory) },
                            colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors(),
                            modifier = Modifier.menuAnchor().fillMaxWidth()
                        )
                        ExposedDropdownMenu(
                            expanded = expandedCategory,
                            onDismissRequest = { expandedCategory = false }
                        ) {
                            state.categories.forEach { category ->
                                val itemText = category.replace('_',' ')
                                    .lowercase()
                                    .replaceFirstChar { it.uppercase() }

                                DropdownMenuItem(
                                    text = { Text(itemText) },
                                    onClick = {
                                        selectedCategory = category
                                        expandedCategory = false
                                        onFilterChanged(selectedCategory,selectedScope)
                                    }
                                )
                            }
                        }
                    }

                    ExposedDropdownMenuBox(
                        expanded = expandedScope,
                        onExpandedChange = { expandedScope = !expandedScope },
                        modifier = Modifier.width(150.dp).height(56.dp)
                    ) {
                        OutlinedTextField(
                            value = selectedScope.replace('_',' ')
                                .lowercase()
                                .replaceFirstChar { it.uppercase() },
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Scope") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedScope) },
                            colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors(),
                            modifier = Modifier.menuAnchor().fillMaxWidth()
                        )
                        ExposedDropdownMenu(
                            expanded = expandedScope,
                            onDismissRequest = { expandedScope = false }
                        ) {
                            state.scopes.forEach { scope ->
                                val itemText = scope.replace('_',' ')
                                    .lowercase()
                                    .replaceFirstChar { it.uppercase() }

                                DropdownMenuItem(
                                    text = { Text(itemText) },
                                    onClick = {
                                        selectedScope = scope
                                        expandedScope = false
                                        onFilterChanged(selectedCategory,selectedScope)
                                    }
                                )
                            }
                        }
                    }
                }
            }

            if (state.isLoadingLeaderboard) {
                item {
                    Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
            } else if (state.error != null) {
                item {
                    Text(text = state.error, color = MaterialTheme.colorScheme.error)
                }
            } else {
                val leaderboard = state.leaderboard
                if (leaderboard != null) {
                    items(leaderboard.entries) { entry ->
                        RankCard(
                            name = entry.displayName,
                            score = entry.score,
                            isUser = entry.rank == leaderboard.myRank
                        )
                        HorizontalDivider()
                    }
                }
            }
        }
    }
}

//@Preview(showBackground=true)
//@Composable
//fun AchievementsPreview() {
//    val mockLeaderboard = com.omnitech.drivingtracker.data.models.LeaderboardData(
//        category = "OVERALL",
//        scope = "GLOBAL",
//        entries = listOf(
//            com.omnitech.drivingtracker.data.models.LeaderboardEntry(1, "1", "Brayden B", 87.0),
//            com.omnitech.drivingtracker.data.models.LeaderboardEntry(2, "2", "You", 80.0),
//            com.omnitech.drivingtracker.data.models.LeaderboardEntry(3, "3", "Mosa L", 75.0)
//        ),
//        myRank = 2,
//        myScore = 80.0
//    )
//
//    DrivingTrackerTheme {
//        AchievementsContent(
//            state = AchievementsUiState(
//                leaderboard = mockLeaderboard,
//                categories = listOf("OVERALL", "SAFETY", "ECO"),
//                scopes = listOf("WEEKLY", "GLOBAL"),
//                overallScore = 85
//            )
//        )
//    }
//}