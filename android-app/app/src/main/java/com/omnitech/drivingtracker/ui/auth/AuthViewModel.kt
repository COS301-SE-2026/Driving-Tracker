package com.omnitech.drivingtracker.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.omnitech.drivingtracker.data.api.ApiException
import com.omnitech.drivingtracker.data.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class AuthViewModel(private val repository: AuthRepository) : ViewModel() {

    sealed class UiState {
        object Idle : UiState()
        object Loading : UiState()
        object Success : UiState()
        data class Error(
            val code: String? = null,
            val message: String? = null
        ) : UiState()
    }

    private val _uiState= MutableStateFlow<UiState>(UiState.Idle)
    val uiState: StateFlow<UiState> = _uiState

    fun register(
        username: String,
        name: String,
        surname: String,
        email: String,
        password: String,
        consentStatus: Boolean
    ){
        viewModelScope.launch {
            _uiState.value = UiState.Loading

            repository.register(username, name, surname, email, password, consentStatus).fold(
                onSuccess = {
                    _uiState.value = UiState.Success
                },
                onFailure = { exception ->
                    when {
                        exception is ApiException -> {
                            _uiState.value = UiState.Error(message = exception.errorMessage ?: "Something went wrong",
                                code = exception.errorCode)
                        }
                        else -> {
                            _uiState.value = UiState.Error(
                                message = exception.message ?: "Something went wrong"
                            )
                        }
                    }
                }
            )
        }
    }

}