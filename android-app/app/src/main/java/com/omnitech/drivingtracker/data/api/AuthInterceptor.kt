package com.omnitech.drivingtracker.data.api

import com.google.gson.Gson
import com.omnitech.drivingtracker.data.local.SessionManager
import com.omnitech.drivingtracker.data.models.AuthResponse
import com.omnitech.drivingtracker.data.models.ErrorDto
import com.omnitech.drivingtracker.data.models.RefreshRequest
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import javax.inject.Inject
import javax.inject.Named

class AuthInterceptor @Inject constructor (private val sessionManager: SessionManager,
    @param:Named("baseUrl") private val baseUrl: String) : Interceptor {
    private val gson = Gson()
    private val client = OkHttpClient()

    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val token = sessionManager.getAccessToken()

        var request = originalRequest
        if (token != null) {
            request = originalRequest.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        }

        val response = chain.proceed(request)

        //Check if token expired
        if (response.code == 401) {
            val responseBodyString = response.peekBody(Long.MAX_VALUE).string()
            val errorDto = try {
                gson.fromJson(responseBodyString, ErrorDto::class.java)
            } catch (e: Exception) {
                null
            }

            if (errorDto?.error == "TOKEN_EXPIRED" || errorDto?.error == "UNAUTHORIZED") {
                synchronized(this) {
                    //Check if token was refreshed by another thread
                    val refreshedToken = sessionManager.getAccessToken()
                    if (refreshedToken != null && refreshedToken != token) {
                        response.close()

                        return chain.proceed(
                            originalRequest.newBuilder()
                                .header("Authorization", "Bearer $refreshedToken")
                                .build()
                        )
                    }

                    //Attempt to refresh the token
                    val refreshToken = sessionManager.getRefreshToken()
                    if (refreshToken != null) {
                        val authResponse = performRefresh(refreshToken)

                        if (authResponse != null) {
                            sessionManager.saveTokens(authResponse.token, authResponse.refresh_token)
                            response.close()
                            return chain.proceed(
                                originalRequest.newBuilder()
                                    .header("Authorization", "Bearer ${authResponse.token}")
                                    .build()
                            )
                        } else {
                            //Refresh failed
                            sessionManager.clearTokens()
                        }
                    } else {
                        sessionManager.clearTokens()
                    }
                }
            }
        }

        return response
    }

    private fun performRefresh(refreshToken: String): AuthResponse? {
        val refreshRequest = RefreshRequest(refreshToken)
        val body = gson.toJson(refreshRequest).toRequestBody("application/json".toMediaType())
        
        val url = "${baseUrl}api/auth/refresh"
        val request = Request.Builder()
            .url(url)
            .post(body)
            .build()

        return try {
            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val responseBody = response.body?.string()
                gson.fromJson(responseBody, AuthResponse::class.java)
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }
}
