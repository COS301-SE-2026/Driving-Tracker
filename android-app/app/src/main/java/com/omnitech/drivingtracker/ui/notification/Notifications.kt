package com.omnitech.drivingtracker.ui.notification

import android.icu.text.CaseMap
import androidx.compose.runtime.Composable
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.Alignment
import androidx.compose.ui.graphics.Color
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.navigation.NavController
import com.omnitech.drivingtracker.ui.components.*



@Composable
fun NotificationsScreen(
    navController: NavController? = null,
    viewModel: NotificationViewModel = hiltViewModel()
) {
    //State to track which sections are expanded
    var expandedToday by remember { mutableStateOf(true) }
    var expandedYesterday by remember { mutableStateOf(true) }
    var expandedThisWeek by remember { mutableStateOf(true) }
    var expandedEarlier by remember { mutableStateOf(true) }

    //Ui state
    val state by viewModel.uiState.collectAsState()
    var showAddContactDialog by remember { mutableStateOf(false) }

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
            BottomNavBar(navController = navController, color = "alerts")
        }
    ) { paddingValues ->
        LazyColumn(
            modifier =  Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 24.dp),
            contentPadding = PaddingValues(top = 16.dp, bottom = 32.dp)
        ) {

            //Today
            item{
                NotificationSectionHeader("Today", expandedToday) { expandedToday = !expandedToday }
            }
            item {
                AnimatedVisibility(visible = expandedToday) {
                    Column {
                        NotificationCard(NotificationItem("1", NotificationType.CONTACT_REQUEST, "Lesedi P"))
                        NotificationCard(NotificationItem("2", NotificationType.BADGE_EARNED, badgeName = "Safe Driver"))
                    }
                }
            }

            item{ Spacer(modifier = Modifier.height(24.dp)) }

            //Yesterday
            item{
                NotificationSectionHeader("Yesterday", expandedYesterday) { expandedYesterday = !expandedYesterday }
            }
            item {
                AnimatedVisibility(visible = expandedYesterday) {
                    NotificationCard(NotificationItem("3", NotificationType.REQUEST_ACCEPTED, "Mosa L"))
                }
            }

            //This Week
            item{ Spacer(modifier = Modifier.height(24.dp)) }

            item{
                NotificationSectionHeader("This Week", expandedThisWeek) { expandedThisWeek = !expandedThisWeek }
            }
            item {
                AnimatedVisibility(visible = expandedThisWeek) {
                    Column {
                        NotificationCard(NotificationItem("4", NotificationType.CONTACT_REQUEST, "Brayden B"))
                        NotificationCard(NotificationItem("5", NotificationType.BADGE_EARNED, badgeName = "Street King"))
                        NotificationCard(NotificationItem("6", NotificationType.REQUEST_ACCEPTED, "Sente M"))
                    }
                }
            }

            //Earlier
            item{ Spacer(modifier = Modifier.height(24.dp)) }

            item{
                NotificationSectionHeader("Earlier", expandedEarlier) { expandedEarlier = !expandedEarlier }
            }
            item {
                AnimatedVisibility(visible = expandedEarlier) {
                    Column {
                        NotificationCard(NotificationItem("7", NotificationType.CONTACT_REQUEST, "Larry B"))
                        NotificationCard(NotificationItem("8", NotificationType.BADGE_EARNED, badgeName = "Mr Safe"))

                    }
                }
            }

        }
    }

}

@Composable
fun NotificationSectionHeader(
    title: String,
    isExpanded: Boolean,
    onToggle: () -> Unit
) {

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onToggle() }
            .padding(vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {

        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium
        )

        Icon(
            imageVector = if (isExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
            contentDescription = if (isExpanded) "Collapse" else "Expand",
            modifier = Modifier.size(32.dp)
        )

    }

}



@Preview(showBackground = true)
@Composable
fun NotificationsPreview() {
    NotificationsScreen()
}