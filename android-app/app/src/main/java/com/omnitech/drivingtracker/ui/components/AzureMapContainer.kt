package com.omnitech.drivingtracker.ui.components

import android.annotation.SuppressLint
import android.util.Log
import android.webkit.ConsoleMessage
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import org.json.JSONObject
import java.util.Locale

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun AzureMapContainer(
    subscriptionKey: String,
    modifier: Modifier = Modifier,
    latitude: Double = -25.7479,
    longitude: Double = 28.2293,
    zoom: Int = 8,
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

    AndroidView(
        factory = { context ->
            WebView(context).apply {
                webViewRef = this
                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    cacheMode = android.webkit.WebSettings.LOAD_DEFAULT
                    mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                    allowFileAccess = true
                    allowContentAccess = true
                    allowUniversalAccessFromFileURLs = true
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

                addJavascriptInterface(object {
                    @JavascriptInterface
                    fun onMapStable() {
                        post {
                            Log.d("AzureMap", "Kotlin: Map reported STABLE")
                            isMapStable = true
                            onMapReady()
                        }
                    }

                    @JavascriptInterface
                    fun onMapError(message: String) {
                        Log.e("AzureMap", "Error from JS: $message")
                    }
                }, "Android")

                webViewClient = object : WebViewClient() {
                    override fun onPageFinished(view: WebView, url: String?) {
                        super.onPageFinished(view, url)
                        if (hasInitialized) return
                        hasInitialized = true

                        // Safely pass the key and initial position
                        val keyJson = JSONObject.quote(subscriptionKey)
                        val lat = String.format(Locale.US, "%.8f", latitude)
                        val lng = String.format(Locale.US, "%.8f", longitude)
                        
                        Log.d("AzureMap", "Kotlin: Initializing Map via JS bridge")
                        view.evaluateJavascript(
                            "javascript:initializeMap($keyJson, $lat, $lng, $zoom)",
                            null
                        )
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