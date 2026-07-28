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
import com.omnitech.drivingtracker.Screen
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
    var expandedRequests by remember { mutableStateOf(true) }
    var expandedTrips by remember { mutableStateOf(true) }

    //Ui state
    val state by viewModel.uiState.collectAsState()
    val noNotificationError = "No notifications"

    LaunchedEffect(Unit) {
        viewModel.getContactRequests()
        viewModel.getNotifications()
        viewModel.getTripsSharedWithMe()
    }

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

            //Pending requests
            item{
                NotificationSectionHeader("Requests", expandedRequests) { expandedRequests = !expandedRequests }
            }

            item {
                AnimatedVisibility(visible = expandedRequests) {
                    Column {
                        if(state.requests.isNotEmpty()){

                            state.requests.forEach { request ->
                                NotificationCard(NotificationItem(request.contactId, NotificationType.TRUSTED_CONTACT_REQUEST, request.username),
                                    onAccept = { viewModel.respondTrustedContactRequest(request.contactId, "APPROVED")},
                                    onIgnore = { viewModel.respondTrustedContactRequest(request.contactId, "DENIED")}
                                )
                            }
                        }else {
                            Text(text = noNotificationError,
                                style = MaterialTheme.typography.bodyMedium,
                            )
                        }
                    }
                }
            }

            item{
                NotificationSectionHeader("Trips Shared With You", expandedTrips) { expandedTrips = !expandedTrips }
            }
            item {
                AnimatedVisibility(visible = expandedTrips) {
                    Column {

                        val tripsSharedWithYou = state.trips

                        if(tripsSharedWithYou.isEmpty()){
                            Text(text = noNotificationError,
                                style = MaterialTheme.typography.bodyMedium,
                            )
                        } else {
                            tripsSharedWithYou.forEach{ trip ->
                                val body = "View ${trip.owner}'s shared trip"
                                NotificationCard(NotificationItem(trip.tripId, NotificationType.valueOf("VIEW_SHARED_TRIP"), body = body),
                                    onAccept = { navController?.navigate(Screen.LiveTripContacts.createRoute(trip.tripId)) }
                                )
                            }
                        }
                    }
                }
            }

            item{ Spacer(modifier = Modifier.height(24.dp)) }

            //Today
            item{
                NotificationSectionHeader("Today", expandedToday) { expandedToday = !expandedToday }
            }
            item {
                AnimatedVisibility(visible = expandedToday) {
                    Column {
                        val notificationsToday = state.groupedNotifications["Today"]

                        if(notificationsToday.isNullOrEmpty()){
                            Text(text = noNotificationError,
                                style = MaterialTheme.typography.bodyMedium,
                            )
                        }else {
                            notificationsToday.forEach{ notification ->
                                NotificationCard(NotificationItem(notification.notificationId, NotificationType.valueOf(notification.type), body = notification.body?:""))
                            }
                        }
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
                    Column {
                        val notificationsYesterday = state.groupedNotifications["Yesterday"]

                        if(notificationsYesterday.isNullOrEmpty()){
                            Text(text = noNotificationError,
                                style = MaterialTheme.typography.bodyMedium,
                            )
                        }else {
                            notificationsYesterday.forEach{ notification ->
                                NotificationCard(NotificationItem(notification.notificationId, NotificationType.valueOf(notification.type), body= notification.body?:""))
                            }
                        }
                    }
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

                        val notificationsWeek = state.groupedNotifications["This Week"]

                        if(notificationsWeek.isNullOrEmpty()){
                            Text(text = noNotificationError,
                                style = MaterialTheme.typography.bodyMedium,
                            )
                        } else {
                            notificationsWeek.forEach{ notification ->
                                NotificationCard(NotificationItem(notification.notificationId, NotificationType.valueOf(notification.type), body = notification.body?:""))
                            }
                        }
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
                        val notificationsEarlier = state.groupedNotifications["Earlier"]

                        if(notificationsEarlier.isNullOrEmpty()){
                            Text(text = noNotificationError,
                                style = MaterialTheme.typography.bodyMedium,
                            )
                        } else {
                            notificationsEarlier.forEach{ notification ->
                                NotificationCard(NotificationItem(notification.notificationId, NotificationType.valueOf(notification.type), body = notification.body?:""))
                            }
                        }
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