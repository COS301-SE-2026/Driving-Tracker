package com.omnitech.drivingtracker.ui.components

import android.annotation.SuppressLint
import android.util.Log
import android.webkit.ConsoleMessage
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.annotation.Keep
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import com.omnitech.drivingtracker.data.models.LocationDto
import com.google.gson.Gson
import org.json.JSONObject
import java.util.Locale

/**
 * Interface for JavaScript to call into Kotlin.
 * Using a named class with @Keep prevents "unused function" warnings.
 */
@Keep
private class MapJavascriptInterface(
    private val webView: WebView,
    private val onReady: () -> Unit,
    private val onStable: () -> Unit,
    private val onError: (String) -> Unit
) {
    @JavascriptInterface
    fun onMapReady() {
        webView.post { onReady() }
    }

    @JavascriptInterface
    fun onMapStable() {
        webView.post { onStable() }
    }

    @JavascriptInterface
    fun onMapError(message: String) {
        onError(message)
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun AzureMapContainer(
    subscriptionKey: String,
    modifier: Modifier = Modifier,
    latitude: Double = -25.7479,
    longitude: Double = 28.2293,
    zoom: Int = 15,
    recenterTrigger: Int = 0,
    destination: LocationDto? = null,
    actualRoute : List<LocationDto>? = null,
    plannedRoute: List<LocationDto>? = null,
    onMapReady: () -> Unit = {}
) {
    var isMapStable by remember { mutableStateOf(false) }
    var webViewRef by remember { mutableStateOf<WebView?>(null) }
    var hasInitialized by remember { mutableStateOf(false) }

    // React to coordinate changes after the map is stable
    LaunchedEffect(latitude, longitude, zoom, isMapStable) {
        if (!isMapStable) return@LaunchedEffect
        val lat = String.format(Locale.US, "%.8f", latitude)
        val lng = String.format(Locale.US, "%.8f", longitude)
        webViewRef?.evaluateJavascript("javascript:window.updateCamera($lat, $lng, $zoom)", null)
    }
    // Automatic Marker Update (No camera move)
    LaunchedEffect(latitude, longitude, isMapStable) {
        if (!isMapStable) return@LaunchedEffect
        webViewRef?.evaluateJavascript("javascript:window.updateUserLocation($latitude, $longitude)", null)
    }

    // Manual Camera Recenter (Triggered by button)
    LaunchedEffect(recenterTrigger) {
        if (isMapStable && recenterTrigger > 0) {
            webViewRef?.evaluateJavascript("javascript:window.centerOnUser($zoom)", null)
        }
    }
    // destination that will be on the map
    LaunchedEffect(destination, isMapStable) {
        if (isMapStable && destination != null) {
            webViewRef?.evaluateJavascript("javascript:window.setDestination(${destination.lat}, ${destination.lng})", null)
        }
    }
    //shortest route
    LaunchedEffect(plannedRoute, isMapStable) {
        if (isMapStable && plannedRoute != null) {
            val pointsJson = Gson().toJson(plannedRoute)
            webViewRef?.evaluateJavascript("javascript:window.setPlannedRoute('$pointsJson')", null)
        }
    }
    LaunchedEffect(actualRoute, isMapStable) {
        if (isMapStable && !actualRoute.isNullOrEmpty()) {
            val pointsJson = Gson().toJson(actualRoute)
            webViewRef?.evaluateJavascript("javascript:window.setActualRoute('$pointsJson')", null)
        }
    }


    AndroidView(
        factory = { context ->
            WebView(context).apply {
                layoutParams = android.view.ViewGroup.LayoutParams(
                    android.view.ViewGroup.LayoutParams.MATCH_PARENT,
                    android.view.ViewGroup.LayoutParams.MATCH_PARENT
                )
                webViewRef = this
                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    cacheMode = android.webkit.WebSettings.LOAD_DEFAULT
                    mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                    allowFileAccess = true
                    allowContentAccess = true
                    @Suppress("DEPRECATION")
                    allowUniversalAccessFromFileURLs = true
                    @Suppress("DEPRECATION")
                    allowFileAccessFromFileURLs = true
                }

                webChromeClient = object : WebChromeClient() {
                    override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                        consoleMessage?.let {
                            Log.d("AzureMapJS", "${it.message()} -- line ${it.lineNumber()}")
                        }
                        return true
                    }
                }

                addJavascriptInterface(
                    MapJavascriptInterface(
                        webView = this,
                        onReady = { Log.d("AzureMap", "Kotlin: Map reported READY") },
                        onStable = {
                            Log.d("AzureMap", "Kotlin: Map reported STABLE")
                            isMapStable = true
                            onMapReady()
                        },
                        onError = { Log.e("AzureMap", "Error from JS: $it") }
                    ),
                    "Android"
                )

                webViewClient = object : WebViewClient() {
                    override fun onPageFinished(view: WebView, url: String?) {
                        super.onPageFinished(view, url)
                        if (hasInitialized) return
                        hasInitialized = true

                        // Delay initialization slightly to ensure the layout is settled
                        view.postDelayed({
                            val keyJson = JSONObject.quote(subscriptionKey)
                            val lat = String.format(Locale.US, "%.8f", latitude)
                            val lng = String.format(Locale.US, "%.8f", longitude)
                            
                            val jsCall = "javascript:window.initializeMap($keyJson, $lat, $lng, $zoom)"
                            Log.d("AzureMap", "Kotlin: Evaluating: $jsCall")
                            view.evaluateJavascript(jsCall, null)
                        }, 200)
                    }
                }

                try {
                    val htmlContent = context.assets.open("azure_map.html").bufferedReader().use { it.readText() }
                    loadDataWithBaseURL("https://atlas.microsoft.com/", htmlContent, "text/html", "UTF-8", null)
                } catch (e: Exception) {
                    Log.e("AzureMap", "Failed to load map asset: ${e.message}")
                }
            }
        },
        modifier = modifier
    )
}