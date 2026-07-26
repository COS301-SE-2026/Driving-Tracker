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

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val repository: AuthRepository
): ViewModel(){
    private val _uiState = MutableStateFlow<UiState>(UiState.Loading)
    val uiState = _uiState.asStateFlow()

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

    sealed class UiState{
        object Loading : UiState()
        data class Success(val profile: ProfileData) : UiState()
        data class Error(val message: String) : UiState()
    }
}