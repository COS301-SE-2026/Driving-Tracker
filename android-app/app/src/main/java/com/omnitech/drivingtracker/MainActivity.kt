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
import androidx.activity.viewModels
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.navigation.navDeepLink
import com.omnitech.drivingtracker.ui.auth.AuthViewModel
import com.omnitech.drivingtracker.ui.auth.ForgotPasswordScreen
import com.omnitech.drivingtracker.ui.trip.LiveTripContacts
import com.omnitech.drivingtracker.ui.analytics.DriverAnalytics
import com.omnitech.drivingtracker.ui.analytics.FuelAnalytics
import com.omnitech.drivingtracker.ui.analytics.FuelComparisonScreen
import com.omnitech.drivingtracker.ui.auth.ResetPasswordScreen

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

    data object  OBDConnect : Screen("obd_connect")

    data object Settings : Screen("settings")

    data object Help : Screen("help")

    data object Notifications : Screen("notifications")

    data object Profile : Screen("profile")

    data object More : Screen("more")

    data object Analytics : Screen("analytics")

    data object FuelAnalytics : Screen("fuel_analytics")

    data object ForgotPassword : Screen("forgot_password")

    data object FuelComparison : Screen("fuel_comparison")
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

    private fun determineStartRoute(authState: AuthViewModel.UiState): String {
        return if (authState is AuthViewModel.UiState.Authenticated) getPostAuthDestination()
        else Screen.Welcome.route
    }

    //navigate from a notification
    fun handleNotificationNavigation(navController: NavController) {
        val destination = intent.getStringExtra("navigate_to")?: return

        navController.navigate(destination)
        intent.removeExtra("navigate_to")
    }

    //Navigate to destination post auth
    fun navigatePostAuth(navController: NavController) {
        navController.navigate(getPostAuthDestination()) {
            popUpTo(Screen.Welcome.route) { inclusive = true }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {

        val splashScreen = installSplashScreen()

        super.onCreate(savedInstanceState)

        //For checking if user can skip log in
        val authViewModel: AuthViewModel by viewModels()

        splashScreen.setKeepOnScreenCondition {
            authViewModel.uiState.value is AuthViewModel.UiState.Loading ||
                    authViewModel.uiState.value is AuthViewModel.UiState.Idle
        }

        enableEdgeToEdge()
        setContent {

            val authState by authViewModel.uiState.collectAsState()

            //Check if user session is still valid
            LaunchedEffect(Unit) {
                authViewModel.checkSession()
            }

            var darkMode by rememberSaveable {mutableStateOf(false)}
            val onDarkModeChange: (Boolean) -> Unit = {darkMode = it}

            DrivingTrackerTheme(darkTheme = darkMode){

                val navController = rememberNavController()
                val lifecycleOwner = LocalLifecycleOwner.current

                //Navigation through notifications
                DisposableEffect(lifecycleOwner) {
                    val observer = LifecycleEventObserver { _, event ->

                        if((event == Lifecycle.Event.ON_RESUME) && authState is AuthViewModel.UiState.Authenticated){
                           handleNotificationNavigation(navController)
                        }
                    }
                    lifecycleOwner.lifecycle.addObserver(observer)
                    onDispose {
                        lifecycleOwner.lifecycle.removeObserver(observer)
                    }
                }

                if(authState is AuthViewModel.UiState.Loading ||
                    authState is AuthViewModel.UiState.Idle){
                    return@DrivingTrackerTheme
                }

                val startRoute = determineStartRoute(authState)
                val isAuthenticated = authState is AuthViewModel.UiState.Authenticated

                LaunchedEffect(isAuthenticated) {
                    if (isAuthenticated) handleNotificationNavigation(navController)
                }

                NavHost(navController = navController, startDestination = startRoute){
                    composable(Screen.Welcome.route){
                        WelcomePage(
                            onLoginClick = { navController.navigate(Screen.Login.route) },
                            onSignUpClick = { navController.navigate(Screen.SignUp.route) }
                        )
                    }
                    composable(Screen.Login.route){

                        LoginScreen(
                            navController = navController,
                            onLoginSuccess = { navigatePostAuth(navController) },
                            onBackClick = { navController.popBackStack() }
                        )
                    }
                    composable(Screen.SignUp.route){
                        SignUpScreen(
                            onSignUpSuccess = {
                                navController.navigate(Screen.Login.route) {
                                    popUpTo(Screen.Welcome.route) {
                                        inclusive = false
                                    }
                                }
                            },
                            onBackClick = { navController.popBackStack() }
                        )
                    }
                    composable(Screen.ForgotPassword.route){
                        ForgotPasswordScreen(onBackClick =  { navController.popBackStack() })
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
                    composable(Screen.Profile.route){
                        Profile(navController = navController)
                    }
                    composable(Screen.Analytics.route){
                        DriverAnalytics(navController = navController)
                    }
                    composable(Screen.FuelAnalytics.route){
                        FuelAnalytics(navController = navController)
                    }
                    composable(
                        route = Screen.LiveTripContacts.route,
                        arguments = listOf(navArgument("trip_id") { type=NavType.StringType })
                    ) { backStackEntry->
                        val tripId = backStackEntry.arguments?.getString("trip_id") ?: ""
                        val name = backStackEntry.arguments?.getString("name") ?: ""

                        LiveTripContacts(driverName = name, navController = navController, tripId = tripId )
                    }

                    composable(
                        route = "verify-success",
                        deepLinks = listOf(
                            navDeepLink { uriPattern = "driving-tracker://verify-success" }
                        )
                    ){
                        LoginScreen(
                            onLoginSuccess = { navigatePostAuth(navController) },
                            onBackClick = { navController.popBackStack() },
                            //verificationSuccess = true
                        )
                    }

                    composable(
                        route = "reset-password?token={token}",
                        deepLinks = listOf(
                            navDeepLink { uriPattern = "driving-tracker://reset-password?token={token}" }
                        ),
                        arguments = listOf(
                            navArgument("token"){
                                type = NavType.StringType
                            }
                        )
                    ){ backStackEntry ->
                        val token = backStackEntry.arguments?.getString("token") ?: ""

                        ResetPasswordScreen(
                            token = token,
                            onResetSuccess = {
                                navController.navigate(Screen.Login.route){
                                    popUpTo(Screen.Welcome.route){
                                        inclusive = false
                                    }
                                }
                            }
                        )
                    }

                    composable(Screen.FuelComparison.route) {
                        FuelComparisonScreen(navController = navController)
                    }
                }

            }
        }
    }
}
