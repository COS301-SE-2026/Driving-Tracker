package com.omnitech.drivingtracker

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.omnitech.drivingtracker.ui.achievements.AchievementsScreen
import com.omnitech.drivingtracker.ui.auth.LoginScreen
import com.omnitech.drivingtracker.ui.auth.SignUpScreen
import com.omnitech.drivingtracker.ui.auth.WelcomePage
import com.omnitech.drivingtracker.ui.contacts.Contacts
import com.omnitech.drivingtracker.ui.home.Dashboard
import com.omnitech.drivingtracker.ui.challenges.WeeklyChallenges
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import com.omnitech.drivingtracker.ui.trip.LiveTrip
import com.omnitech.drivingtracker.ui.trip.Trips
import com.omnitech.drivingtracker.ui.obd.Vehicles
import com.omnitech.drivingtracker.ui.other.Settings
import com.omnitech.drivingtracker.ui.other.*
import com.omnitech.drivingtracker.ui.obd.*
import androidx.navigation.NavType
import androidx.navigation.navArgument
import com.omnitech.drivingtracker.ui.obd.OBDConnect
import com.omnitech.drivingtracker.ui.trip.TripSummary
import dagger.hilt.android.AndroidEntryPoint
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import com.omnitech.drivingtracker.ui.obd.OBDMain
import androidx.compose.runtime.saveable.*

sealed class Screen(val route: String){
    data object Welcome : Screen("welcome")
    data object Login : Screen("login")
    data object SignUp : Screen("signup")
    data object Dashboard : Screen("dashboard")
    data object Trips : Screen("trips")
    data object Contacts : Screen("contacts")
    data object Achievements : Screen("achievements")

//    data object TripSummary : Screen("trip_summary")
    data object TripSummary : Screen("trip_summary/{trip_id}") {
        fun createRoute(tripId: String) = "trip_summary/$tripId"
    }

    data object LiveTrip : Screen("live_trip/{trip_id}") {
        fun createRoute(tripId: String) = "live_trip/$tripId"
    }
    data object WeeklyChallenges : Screen("weekly_challenges")

    data object Vehicles : Screen("vehicles")

    data object OBDMain : Screen("obd_main")

    data object OBDKeyData : Screen("obd_key_data")

    data object OBDLiveWarnings : Screen("obd_live_warnings")

    data object  OBDConnect : Screen("obd_connect")

    data object Settings : Screen("settings")

    data object Help : Screen("help")

    data object Notifications : Screen("notifications")

    data object Profile : Screen("profile")

    data object More : Screen("more")
}

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {

            var darkMode by rememberSaveable {mutableStateOf(false)}
            val onDarkModeChange: (Boolean) -> Unit = {darkMode = it}

            DrivingTrackerTheme(darkTheme = darkMode){

                val navController = rememberNavController()

                NavHost(navController = navController, startDestination = Screen.Welcome.route){
                    composable(Screen.Welcome.route){
                        WelcomePage(
                            onLoginClick = { navController.navigate(Screen.Dashboard.route) },
                            onSignUpClick = { navController.navigate(Screen.SignUp.route) }
                        )
                    }
                    composable(Screen.Login.route){

                        LoginScreen(
                            onLoginSuccess = {
                                navController.navigate(Screen.Dashboard.route){
                                    popUpTo(Screen.Welcome.route) { inclusive = true }
                                }
                            },
                            onBackClick = { navController.popBackStack() }
                        )
                    }
                    composable(Screen.SignUp.route){
                        SignUpScreen(
                            onSignUpSuccess = {
                                navController.navigate(Screen.Dashboard.route){
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
                        Trips(navController = navController)
                    }

                    composable(Screen.WeeklyChallenges.route){
                        WeeklyChallenges(navController = navController)
                    }

                    composable(Screen.Contacts.route){
                        Contacts(navController = navController)
                    }
                    composable(Screen.Achievements.route){
                        AchievementsScreen(navController = navController)
                    }
                    composable(
                        route = Screen.TripSummary.route,
                        arguments = listOf(navArgument("trip_id") { type=NavType.StringType })
                    ) { backStackEntry->
                        val tripId = backStackEntry.arguments?.getString("trip_id") ?: ""
                        TripSummary(tripId = tripId, navController = navController)
                    }
                    composable(
                        route = Screen.LiveTrip.route,
                        arguments = listOf(navArgument("trip_id") { type=NavType.StringType })
                    ) { backStackEntry->
                        val tripId = backStackEntry.arguments?.getString("trip_id") ?: ""

                        LiveTrip(tripId = tripId, navController = navController)
                    }
                    composable(Screen.OBDConnect.route) {
                        OBDConnect(navController = navController)
                    }
                    composable(Screen.Vehicles.route) {
                        Vehicles(navController = navController)
                    }
                    composable(Screen.Settings.route){
                        Settings(
                            navController = navController,
                            darkMode = darkMode,
                            onDarkModeChange = onDarkModeChange
                        )
                    }
                    composable(Screen.OBDMain.route){
                        OBDMain(navController = navController)
                    }
                    composable(Screen.More.route){
                        More(navController = navController)
                    }
                    composable(Screen.OBDKeyData.route){
                        OBDKeyData(navController = navController)
                    }
                    composable(Screen.OBDLiveWarnings.route){
                        OBDLiveWarnings(navController = navController)
                    }
                }
            }
        }
    }
}
