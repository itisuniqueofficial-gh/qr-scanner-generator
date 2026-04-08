package com.itisuniqueofficial.qr

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Message
import android.webkit.CookieManager
import android.webkit.GeolocationPermissions
import android.webkit.PermissionRequest
import android.webkit.SslErrorHandler
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewFeature
import com.google.android.material.snackbar.Snackbar
import com.itisuniqueofficial.qr.databinding.ActivityMainBinding
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var connectivityManager: ConnectivityManager
    private lateinit var networkCallback: ConnectivityManager.NetworkCallback

    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null
    private var pendingCameraPermissionRequest: PermissionRequest? = null
    private var pendingCameraImageUri: Uri? = null
    private var exitRequestedAt = 0L
    private var isOfflineVisible = false

    private val filePickerLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val callback = fileChooserCallback ?: return@registerForActivityResult
        val uris = when {
            result.resultCode != Activity.RESULT_OK -> null
            result.data == null && pendingCameraImageUri != null -> arrayOfNotNull(pendingCameraImageUri)
            else -> WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data)
        }
        callback.onReceiveValue(uris)
        fileChooserCallback = null
        pendingCameraImageUri = null
    }

    private val permissionLauncher = registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { permissions ->
        val cameraGranted = permissions[Manifest.permission.CAMERA] == true
        if (cameraGranted) {
            pendingCameraPermissionRequest?.grant(arrayOf(PermissionRequest.RESOURCE_VIDEO_CAPTURE))
        } else {
            pendingCameraPermissionRequest?.deny()
            showMessage(getString(R.string.camera_permission_denied))
        }
        pendingCameraPermissionRequest = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

        configureWebView()
        handleBackNavigation()
        registerConnectivityCallback()

        binding.retryButton.setOnClickListener {
            showOfflineState(false)
            loadInitialPage()
        }

        if (savedInstanceState != null) {
            binding.webView.restoreState(savedInstanceState)
        } else {
            loadInitialPage()
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebView() {
        with(binding.webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = false
            allowContentAccess = true
            mediaPlaybackRequiresUserGesture = false
            cacheMode = WebSettings.LOAD_DEFAULT
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            builtInZoomControls = false
            displayZoomControls = false
            useWideViewPort = true
            loadWithOverviewMode = true
            setSupportMultipleWindows(false)
        }

        if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
            WebSettingsCompat.setAlgorithmicDarkeningAllowed(binding.webView.settings, false)
        }

        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(binding.webView, false)

        binding.webView.webViewClient = QrWebViewClient()
        binding.webView.webChromeClient = QrWebChromeClient()
    }

    private fun loadInitialPage() {
        val target = if (isOnline()) BASE_URL else OFFLINE_URL
        binding.webView.loadUrl(target)
    }

    private fun handleBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                when {
                    binding.webView.canGoBack() -> binding.webView.goBack()
                    System.currentTimeMillis() - exitRequestedAt < 2000 -> finish()
                    else -> {
                        exitRequestedAt = System.currentTimeMillis()
                        showMessage(getString(R.string.press_back_again))
                    }
                }
            }
        })
    }

    private fun registerConnectivityCallback() {
        networkCallback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                runOnUiThread {
                    if (isOfflineVisible) {
                        showOfflineState(false)
                        binding.webView.loadUrl(BASE_URL)
                    }
                }
            }

            override fun onLost(network: Network) {
                runOnUiThread {
                    if (!isOnline() && binding.webView.url?.startsWith(BASE_URL) == true) {
                        showOfflineState(true)
                    }
                }
            }
        }
        connectivityManager.registerDefaultNetworkCallback(networkCallback)
    }

    private fun isInternalUrl(uri: Uri): Boolean {
        return uri.scheme == "https" && uri.host == ALLOWED_HOST
    }

    private fun isOnline(): Boolean {
        val network = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    private fun showLoading(loading: Boolean) {
        binding.progressBar.visibility = if (loading) android.view.View.VISIBLE else android.view.View.GONE
    }

    private fun showOfflineState(show: Boolean) {
        isOfflineVisible = show
        binding.offlineGroup.visibility = if (show) android.view.View.VISIBLE else android.view.View.GONE
        binding.webView.visibility = if (show) android.view.View.GONE else android.view.View.VISIBLE
    }

    private fun showMessage(message: String) {
        Snackbar.make(binding.root, message, Snackbar.LENGTH_SHORT).show()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        binding.webView.saveState(outState)
    }

    override fun onDestroy() {
        fileChooserCallback?.onReceiveValue(null)
        fileChooserCallback = null
        runCatching {
            connectivityManager.unregisterNetworkCallback(networkCallback)
        }
        binding.webView.destroy()
        super.onDestroy()
    }

    inner class QrWebViewClient : WebViewClient() {
        override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
            val uri = request?.url ?: return false

            if (uri.scheme == "upi" || uri.scheme == "intent") {
                openExternal(uri)
                return true
            }

            if (isInternalUrl(uri)) {
                return false
            }

            openExternal(uri)
            return true
        }

        override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
            showLoading(true)
            showOfflineState(false)
        }

        override fun onPageFinished(view: WebView?, url: String?) {
            showLoading(false)
        }

        override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
            if (request?.isForMainFrame == true) {
                showLoading(false)
                showOfflineState(true)
            }
        }

        override fun onReceivedSslError(view: WebView?, handler: SslErrorHandler?, error: android.net.http.SslError?) {
            handler?.cancel()
            showLoading(false)
            showOfflineState(true)
            showMessage(getString(R.string.ssl_error_message))
        }
    }

    inner class QrWebChromeClient : WebChromeClient() {
        override fun onProgressChanged(view: WebView?, newProgress: Int) {
            binding.progressBar.progress = newProgress
            if (newProgress >= 100) {
                showLoading(false)
            }
        }

        override fun onShowFileChooser(
            webView: WebView?,
            filePathCallback: ValueCallback<Array<Uri>>?,
            fileChooserParams: FileChooserParams?
        ): Boolean {
            fileChooserCallback?.onReceiveValue(null)
            fileChooserCallback = filePathCallback

            val chooserIntent = Intent(Intent.ACTION_CHOOSER).apply {
                putExtra(Intent.EXTRA_INTENT, Intent(Intent.ACTION_GET_CONTENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "image/*"
                })
                putExtra(Intent.EXTRA_TITLE, getString(R.string.choose_qr_image))
                putExtra(Intent.EXTRA_INITIAL_INTENTS, arrayOf(buildCameraIntent()))
            }

            try {
                filePickerLauncher.launch(chooserIntent)
            } catch (_: ActivityNotFoundException) {
                fileChooserCallback = null
                pendingCameraImageUri = null
                showMessage(getString(R.string.file_chooser_unavailable))
                return false
            }
            return true
        }

        override fun onPermissionRequest(request: PermissionRequest?) {
            if (request == null) return

            val resources = request.resources.toSet()
            if (!resources.contains(PermissionRequest.RESOURCE_VIDEO_CAPTURE)) {
                request.grant(request.resources)
                return
            }

            if (ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                request.grant(arrayOf(PermissionRequest.RESOURCE_VIDEO_CAPTURE))
            } else {
                pendingCameraPermissionRequest = request
                permissionLauncher.launch(requiredPermissions())
            }
        }

        override fun onGeolocationPermissionsShowPrompt(origin: String?, callback: GeolocationPermissions.Callback?) {
            callback?.invoke(origin, false, false)
        }

        override fun onCreateWindow(view: WebView?, isDialog: Boolean, isUserGesture: Boolean, resultMsg: Message?): Boolean {
            return false
        }
    }

    private fun requiredPermissions(): Array<String> {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            arrayOf(Manifest.permission.CAMERA, Manifest.permission.READ_MEDIA_IMAGES)
        } else {
            arrayOf(Manifest.permission.CAMERA, Manifest.permission.READ_EXTERNAL_STORAGE)
        }
    }

    private fun buildCameraIntent(): Intent {
        val imageFile = createImageFile()
        val authority = "${BuildConfig.APPLICATION_ID}.fileprovider"
        pendingCameraImageUri = FileProvider.getUriForFile(this, authority, imageFile)

        return Intent(android.provider.MediaStore.ACTION_IMAGE_CAPTURE).apply {
            putExtra(android.provider.MediaStore.EXTRA_OUTPUT, pendingCameraImageUri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
        }
    }

    private fun createImageFile(): File {
        val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
        val storageDir = File(cacheDir, "uploads").apply { mkdirs() }
        return File.createTempFile("QR_${timeStamp}_", ".jpg", storageDir)
    }

    private fun openExternal(uri: Uri) {
        val intent = Intent(Intent.ACTION_VIEW, uri)
        try {
            startActivity(intent)
        } catch (_: ActivityNotFoundException) {
            showMessage(getString(R.string.no_supported_app))
        }
    }

    companion object {
        private const val ALLOWED_HOST = "qr.itisuniqueofficial.com"
        private const val BASE_URL = "https://qr.itisuniqueofficial.com/"
        private const val OFFLINE_URL = "file:///android_asset/offline-local.html"
    }
}
