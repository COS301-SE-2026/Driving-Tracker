package com.omnitech.drivingtracker.ui.components
import androidx.compose.runtime.Composable
import androidx.navigation.NavController
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.MaterialTheme
import androidx.compose.ui.Modifier
import androidx.compose.material3.Scaffold
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBackIosNew
import androidx.compose.material.icons.filled.Settings
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.verticalScroll
import com.omnitech.drivingtracker.Screen


@Composable
fun StandardScreen(
    navController: NavController?,
    title: String,
    description: String = "",
    showBottomBar: Boolean = true,
    bottomBarColor: String = "",
    onLeftClick: ()-> Unit = {navController?.popBackStack()},
    onRightClick: ()-> Unit = {navController?.navigate(Screen.Settings.route)},
    content : @Composable ColumnScope.() -> Unit
){
    Scaffold(
        topBar = {
            TopBar(
                leftIcon = Icons.Default.ArrowBackIosNew,
                rightIcon = Icons.Default.Settings,
                onLeftClick = onLeftClick,
                onRightClick = onRightClick
            )
        },
        bottomBar = {
            if (showBottomBar) {
                BottomNavBar(navController = navController, color = bottomBarColor)
            }
        }
    ){
        innerPadding -> Column(
            modifier = Modifier.fillMaxSize().padding(innerPadding).verticalScroll(
                rememberScrollState()
            )
        ){
            Text(
                text = title,
                fontWeight = FontWeight.Bold,
                style = MaterialTheme.typography.headlineLarge,
                color = MaterialTheme.colorScheme.onBackground,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
            )
            Text(
                text = description,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onBackground,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
            )
        content()




    }
    }
}