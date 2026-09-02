package com.omnitech.drivingtracker.ui.analytics

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.omnitech.drivingtracker.Screen
import com.omnitech.drivingtracker.ui.components.YourTopBar

@Composable
fun SafetyAnalytics(navController: NavController ?= null){
    Scaffold(
        topBar = {
            YourTopBar(
                leftIcon = Icons.AutoMirrored.Filled.ArrowBack,
                rightIcon = Icons.Default.Settings,
                leftWord = "Safety ",
                rightWord = "Analytics",
                onLeftClick = { navController?.popBackStack()},
                onRightClick = {navController?.navigate(Screen.Settings.route)}
            )
        }
    ) {
        paddingValues->
        Box(
            modifier = Modifier.fillMaxSize()
                .padding(paddingValues)
        ){
            LazyColumn(
                modifier = Modifier.fillMaxSize()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item{

                }
            }
        }
    }
}