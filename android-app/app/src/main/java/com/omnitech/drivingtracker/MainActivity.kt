package com.omnitech.drivingtracker

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.omnitech.drivingtracker.ui.achievements.AchievemtsScreen
import com.omnitech.drivingtracker.ui.auth.AuthViewModelFactory
import com.omnitech.drivingtracker.ui.auth.AuthViewModel
import com.omnitech.drivingtracker.ui.auth.LoginScreen
import com.omnitech.drivingtracker.ui.auth.SignUpScreen
import com.omnitech.drivingtracker.ui.auth.WelcomePage
import com.omnitech.drivingtracker.ui.contacts.Contacts
import com.omnitech.drivingtracker.ui.contacts.ContactsViewModel
import com.omnitech.drivingtracker.ui.home.Dashboard
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import com.omnitech.drivingtracker.ui.trip.TripViewModel
import com.omnitech.drivingtracker.ui.trip.Trips
import com.omnitech.drivingtracker.ui.trip.TripsViewModel

sealed class Screen(val route: String){
    data object Welcome : Screen("welcome")
    data object Login : Screen("login")
    data object SignUp : Screen("signup")
    data object Dashboard : Screen("dashboard")
    data object Trips : Screen("trips")
    data object Contacts : Screen("contacts")
    data object Achievements : Screen("achievements")
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            DrivingTrackerTheme{
                val navController = rememberNavController()

                // Access the AppContainer
                val app = androidx.compose.ui.platform.LocalContext.current.applicationContext as DrivingTrackerApp
                val container = app.container

                NavHost(navController = navController, startDestination = Screen.Welcome.route){
                    composable(Screen.Welcome.route){
                        WelcomePage(
                            onLoginClick = { navController.navigate(Screen.Login.route) },
                            onSignUpClick = { navController.navigate(Screen.SignUp.route) }
                        )
                    }
                    composable(Screen.Login.route){
                        val authViewModel: AuthViewModel = viewModel(
                            factory = AuthViewModelFactory(container.authRepository)
                        )
                        LoginScreen(
                            viewModel = authViewModel,
                            onLoginSuccess = {
                                navController.navigate(Screen.Dashboard.route){
                                    popUpTo(Screen.Welcome.route) { inclusive = true }
                                }
                            },
                            onBackClick = { navController.popBackStack() }
                        )
                    }
                    composable(Screen.SignUp.route){
                        val authViewModel: AuthViewModel = viewModel(
                            factory = AuthViewModelFactory(container.authRepository)
                        )
                        SignUpScreen(
                            viewModel = authViewModel,
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
                        val tripsViewModel: TripsViewModel = viewModel(
                            factory = TripsViewModel.TripsViewModelFactory(container.tripRepository)
                        )
                        val tripViewModel: TripViewModel = viewModel(
                            factory = TripViewModel.TripViewModelFactory(
                                container.tripRepository,
                                container.contactsRepository
                            )
                        )
                        val contactsViewModel: ContactsViewModel = viewModel(
                            factory = ContactsViewModel.ContactsViewModelFactory(container.contactsRepository)
                        )

                        Trips(
                            navController = navController,
                            tripsViewModel = tripsViewModel,
                            tripViewModel = tripViewModel,
                            contactsViewModel = contactsViewModel
                        )
                    }
                    composable(Screen.Contacts.route){
                        val viewModel: ContactsViewModel = viewModel(
                            factory = ContactsViewModel.ContactsViewModelFactory(container.contactsRepository)
                        )
                        Contacts(navController = navController, viewModel = viewModel)
                    }
                    composable(Screen.Achievements.route){
                        AchievemtsScreen(navController = navController)
                    }
                }
            }
        }
    }
}
