package com.omnitech.drivingtracker.data
//
//import android.content.Context
//import com.omnitech.drivingtracker.data.local.SessionManager
//import com.omnitech.drivingtracker.data.repository.AchievementsRepository
//import com.omnitech.drivingtracker.data.repository.AuthRepository
//import com.omnitech.drivingtracker.data.repository.ContactsRepository
//import com.omnitech.drivingtracker.data.repository.TripRepository
//import com.omnitech.drivingtracker.services.RetrofitClient
//import com.omnitech.drivingtracker.data.obd.ObdManager
//
//class AppContainer(context: Context) {
//    // Shared dependencies
//    val sessionManager = SessionManager(context)
//    val apiService = RetrofitClient.getApiService(context)
//    val obdManager = ObdManager(context)
//
//    // Repositories
//    val authRepository: AuthRepository by lazy {
//        AuthRepository(apiService, sessionManager)
//    }
//
//    val contactsRepository: ContactsRepository by lazy {
//        ContactsRepository(apiService)
//    }
//
//    val tripRepository: TripRepository by lazy {
//        TripRepository(apiService)
//    }
//
//    val achievementsRepository: AchievementsRepository by lazy {
//        AchievementsRepository(apiService)
//    }
//}
