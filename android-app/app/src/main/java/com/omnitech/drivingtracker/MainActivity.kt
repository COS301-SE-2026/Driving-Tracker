package com.omnitech.drivingtracker

import android.app.ComponentCaller
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.omnitech.drivingtracker.ui.achievements.AchievementsScreen
import com.omnitech.drivingtracker.ui.auth.LoginScreen
import com.omnitech.drivingtracker.ui.auth.SignUpScreen
import com.omnitech.drivingtracker.ui.auth.WelcomePage
import com.omnitech.drivingtracker.ui.contacts.Contacts
import com.omnitech.drivingtracker.ui.home.Dashboard
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import com.omnitech.drivingtracker.ui.trip.LiveTrip
import com.omnitech.drivingtracker.ui.trip.Trips
import androidx.navigation.NavType
import androidx.navigation.navArgument
import com.omnitech.drivingtracker.ui.notification.NotificationRationale
import dagger.hilt.android.AndroidEntryPoint
import androidx.lifecycle.Lifecycle
import java.util.jar.Manifest

sealed class Screen(val route: String){
    data object Welcome : Screen("welcome")
    data object Login : Screen("login")
    data object SignUp : Screen("signup")
    data object Dashboard : Screen("dashboard")
    data object Trips : Screen("trips")
    data object Contacts : Screen("contacts")
    data object Achievements : Screen("achievements")

    data object TripSummary : Screen("trip_summary")
    data object LiveTrip : Screen("live_trip/{trip_id}") {
        fun createRoute(tripId: String) = "live_trip/$tripId"
    }

    data object NotificationRationale: Screen("notification_rationale")
}

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            DrivingTrackerTheme{
                val navController = rememberNavController()
                val lifecycleOwner = LocalLifecycleOwner.current

                //Navigation through notifications
                DisposableEffect(lifecycleOwner) {
                    val observer = LifecycleEventObserver { _, event ->

                        if(event == Lifecycle.Event.ON_RESUME){
                            val destination = intent.getStringExtra("navigate_to")

                            if (destination != null){
                                navController.navigate(destination)
                                intent.removeExtra("navigate_to")
                            }
                        }
                    }
                    lifecycleOwner.lifecycle.addObserver(observer)
                    onDispose {
                        lifecycleOwner.lifecycle.removeObserver(observer)
                    }
                }

                NavHost(navController = navController, startDestination = Screen.Welcome.route){
                    composable(Screen.Welcome.route){
                        WelcomePage(
                            onLoginClick = { navController.navigate(Screen.Login.route) },
                            onSignUpClick = { navController.navigate(Screen.SignUp.route) }
                        )
                    }
                    composable(Screen.Login.route){

                        LoginScreen(
                            onLoginSuccess = {
                                navController.navigate(Screen.NotificationRationale.route){
                                    popUpTo(Screen.Welcome.route) { inclusive = true }
                                }
                            },
                            onBackClick = { navController.popBackStack() }
                        )
                    }
                    composable(Screen.SignUp.route){
                        SignUpScreen(
                            onSignUpSuccess = {
                                navController.navigate(Screen.NotificationRationale.route){
                                    popUpTo(Screen.Welcome.route) { inclusive = true }
                                }
                            },
                            onBackClick = { navController.popBackStack() }
                        )
                    }
                    composable(Screen.Dashboard.route){
                        Dashboard(navController = navController)
                    }
                    composable(Screen.Trips.route){
                        Trips(navController = navController,)
                    }
                    composable(Screen.Contacts.route){
                        Contacts(navController = navController)
                    }
                    composable(Screen.Achievements.route){
                        AchievementsScreen(navController = navController)
                    }
                    composable(
                        route = Screen.LiveTrip.route,
                        arguments = listOf(navArgument("trip_id") { type=NavType.StringType })
                    ) { backStackEntry->
                        val tripId = backStackEntry.arguments?.getString("trip_id") ?: ""

                        LiveTrip(tripId = tripId, navController = navController)
                    }
                    composable(Screen.NotificationRationale.route) {
                        NotificationRationale(
                            onPermissionHandled = {
                                navController.navigate(Screen.Dashboard.route) {
                                    popUpTo(Screen.NotificationRationale.route) { inclusive = true }
                                }
                        })
                    }
                }
            }
        }
    }
}
