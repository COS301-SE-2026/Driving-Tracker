package com.omnitech.drivingtracker

import android.app.ComponentCaller
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.DisposableEffect
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
import com.omnitech.drivingtracker.ui.notification.NotificationRationale
import com.omnitech.drivingtracker.ui.obd.BluetoothRationale
import androidx.lifecycle.Lifecycle
import android.Manifest
import dagger.hilt.android.AndroidEntryPoint
import com.google.firebase.messaging.FirebaseMessaging
import com.omnitech.drivingtracker.ui.obd.OBDConnect
import com.omnitech.drivingtracker.ui.profile.Profile
import com.omnitech.drivingtracker.ui.trip.TripSummary
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import com.omnitech.drivingtracker.ui.obd.OBDMain
import androidx.compose.runtime.saveable.*
import androidx.navigation.NavController
import com.omnitech.drivingtracker.ui.notification.NotificationsScreen
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import com.omnitech.drivingtracker.ui.obd.ObdViewModel
import androidx.activity.compose.LocalActivity
import com.omnitech.drivingtracker.ui.trip.LiveTripContacts

sealed class Screen(val route: String){
    data object Welcome : Screen("welcome")
    data object Login : Screen("login")
    data object SignUp : Screen("signup")
    data object Dashboard : Screen("dashboard")
    data object Trips : Screen("trips")
    data object Contacts : Screen("contacts")
    data object Achievements : Screen("achievements")

    data object TripSummary : Screen("trip_summary/{trip_id}") {
        fun createRoute(tripId: String) = "trip_summary/$tripId"
    }

    data object LiveTrip : Screen("live_trip/{trip_id}") {
        fun createRoute(tripId: String) = "live_trip/$tripId"
    }

    data object LiveTripContacts : Screen("live_trip_contacts/{trip_id}/{name}") {
        fun createRoute(tripId: String, name: String) = "live_trip_contacts/$tripId/$name"
    }

    data object NotificationRationale: Screen("notification_rationale")

    data object BluetoothRationale: Screen("bluetooth_rationale")

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

    private fun checkNotificationPermission(): Boolean {
        return if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU){
            ContextCompat
                .checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)==
                    PackageManager.PERMISSION_GRANTED
        } else true
    }

    fun getPostAuthDestination(): String {
        return if (checkNotificationPermission()) Screen.Dashboard.route
        else Screen.NotificationRationale.route
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {

            var darkMode by rememberSaveable {mutableStateOf(false)}
            val onDarkModeChange: (Boolean) -> Unit = {darkMode = it}

            DrivingTrackerTheme(darkTheme = darkMode){

                val navController = rememberNavController()
                val lifecycleOwner = LocalLifecycleOwner.current

                //Navigate to destination post auth
                fun navigatePostAuth() {
                    navController.navigate(getPostAuthDestination()) {
                        popUpTo(Screen.Welcome.route) { inclusive = true }
                    }
                }

                //navigate from a notification
                fun handleNotificationNavigation() {
                    val destination = intent.getStringExtra("navigate_to")?: return

                    navController.navigate(destination)
                    intent.removeExtra("navigate_to")
                }

                //Navigation through notifications
                DisposableEffect(lifecycleOwner) {
                    val observer = LifecycleEventObserver { _, event ->

                        if(event == Lifecycle.Event.ON_RESUME){
                           handleNotificationNavigation()
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
                            onLoginSuccess = { navigatePostAuth() },
                            onBackClick = { navController.popBackStack() }
                        )
                    }
                    composable(Screen.SignUp.route){
                        SignUpScreen(
                            onSignUpSuccess = { navigatePostAuth() },
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
                    composable(Screen.Notifications.route){
                        NotificationsScreen(navController = navController)
                    }
                    composable(Screen.Help.route){
                        Help(navController = navController)
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
                    composable(Screen.NotificationRationale.route) {
                        NotificationRationale(
                            onPermissionHandled = {
                                navController.navigate(Screen.Dashboard.route) {
                                    popUpTo(Screen.NotificationRationale.route) { inclusive = true }
                                }
                        })
                    }

                    composable(Screen.BluetoothRationale.route) { //ask about this
                        BluetoothRationale(
                            onPermissionHandled = {
                                navController.navigate(Screen.OBDConnect.route) {
                                    popUpTo(Screen.BluetoothRationale.route) { inclusive = true }
                                }
                            })
                    }

                    composable(Screen.OBDConnect.route) {
                        val activity = LocalActivity.current as ComponentActivity
                        val obdViewModel: ObdViewModel = hiltViewModel(activity)
                        OBDConnect(navController = navController, viewModel = obdViewModel)
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
                        val activity = LocalActivity.current as ComponentActivity
                        val obdViewModel: ObdViewModel = hiltViewModel(activity)
                        OBDKeyData(navController = navController, viewModel = obdViewModel)
                    }
                    composable(Screen.OBDLiveWarnings.route){
                        OBDLiveWarnings(navController = navController)
                    }
                    composable(Screen.Profile.route){
                        Profile(navController = navController)
                    }
                    composable(
                        route = Screen.LiveTripContacts.route,
                        arguments = listOf(navArgument("trip_id") { type=NavType.StringType })
                    ) { backStackEntry->
                        val tripId = backStackEntry.arguments?.getString("trip_id") ?: ""
                        val name = backStackEntry.arguments?.getString("name") ?: ""

                        LiveTripContacts(driverName = name, navController = navController, tripId = tripId )
                    }
                }
            }
        }
    }
}
