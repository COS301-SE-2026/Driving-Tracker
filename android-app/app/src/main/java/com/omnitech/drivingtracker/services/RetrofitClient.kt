package com.omnitech.drivingtracker.services
//
//import android.content.Context
//import com.omnitech.drivingtracker.data.api.AuthInterceptor
//import com.omnitech.drivingtracker.data.local.SessionManager
//import okhttp3.OkHttpClient
//import okhttp3.logging.HttpLoggingInterceptor
//import retrofit2.Retrofit
//import retrofit2.converter.gson.GsonConverterFactory
//
//object RetrofitClient {
//    const val BASE_URL = "http://10.0.2.2:3000/"
//
//    private var apiService: ApiService? = null
//
//    fun getApiService(context: Context): ApiService {
//        return apiService ?: synchronized(this) {
//            val currentService = apiService
//            if (currentService != null) {
//                currentService
//            } else {
//                val sessionManager = SessionManager(context.applicationContext)
//
//                val loggingInterceptor = HttpLoggingInterceptor().apply {
//                    level = HttpLoggingInterceptor.Level.BODY
//                }
//
//                val client = OkHttpClient.Builder()
//                    .addInterceptor(AuthInterceptor(sessionManager))
//                    .addInterceptor(loggingInterceptor)
//                    .build()
//
//                val newService = Retrofit.Builder()
//                    .baseUrl(BASE_URL)
//                    .client(client)
//                    .addConverterFactory(GsonConverterFactory.create())
//                    .build()
//                    .create(ApiService::class.java)
//
//                apiService = newService
//                newService
//            }
//        }
//    }
//}
