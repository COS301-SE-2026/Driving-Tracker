package com.omnitech.drivingtracker.ui.auth

import androidx.lifecycle.ViewModel
import com.omnitech.drivingtracker.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import javax.inject.Inject
import kotlinx.coroutines.flow.asStateFlow
import androidx.lifecycle.viewModelScope
import com.omnitech.drivingtracker.data.api.ApiException
import kotlin.fold
import kotlinx.coroutines.launch
import com.omnitech.drivingtracker.data.models.ProfileData
import dagger.hilt.android.qualifiers.ApplicationContext
import android.content.Context
import androidx.lifecycle.viewmodel.compose.viewModel
import android.net.Uri
import com.omnitech.drivingtracker.utils.ImageUploadUtils

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val repository: AuthRepository,
    @ApplicationContext private val context: Context
): ViewModel(){
    private val _uiState = MutableStateFlow<UiState>(UiState.Loading)
    val uiState = _uiState.asStateFlow()

    private val _isUploadingPicture = MutableStateFlow(false)
    val isUploadingPicture = _isUploadingPicture.asStateFlow()

    private val _uploadError = MutableStateFlow<String?>(null)
    val uploadError = _uploadError.asStateFlow()

    init{
        loadProfile()
    }

    fun loadProfile(){
        viewModelScope.launch{
            _uiState.value = UiState.Loading
            repository.getProfile().fold(
                onSuccess = { profileData -> _uiState.value = UiState.Success(profileData) },
                onFailure = { exception ->
                    val message = when (exception) {
                        is ApiException -> exception.errorMessage ?: "Failed to fetch profile"
                        else -> exception.message ?: "Unknown error"
                    }
                    _uiState.value = UiState.Error(message)
                }
            )
        }
    }

    fun uploadProfilePicture(uri: Uri){
        viewModelScope.launch {
            _uploadError.value = null
            _isUploadingPicture.value = true
            try{
                val part = ImageUploadUtils.uriToMultipart(context, uri, "image")

                repository.uploadProfilePicture(part).fold(
                    onSuccess = { loadProfile() },
                    onFailure = { exception ->
                        _uploadError.value = when (exception){
                            is ApiException -> exception.errorMessage?: "Failed to upload profile picture"
                            else -> exception.message?: "Unknown error"
                        }
                    }
                )
            }catch (e: IllegalArgumentException){
                _uploadError.value = e.message ?: "Invalid image"
            }finally {
                _isUploadingPicture.value = false
            }
        }
    }

    fun clearUploadError(){
        _uploadError.value = null
    }

    sealed class UiState{
        object Loading : UiState()
        data class Success(val profile: ProfileData) : UiState()
        data class Error(val message: String) : UiState()
    }
}