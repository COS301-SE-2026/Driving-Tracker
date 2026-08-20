package com.omnitech.drivingtracker.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.omnitech.drivingtracker.data.api.ApiException
import com.omnitech.drivingtracker.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.Period
import javax.inject.Inject

@HiltViewModel
class AuthViewModel @Inject constructor(private val repository: AuthRepository) : ViewModel() {

    sealed class UiState {
        object Idle : UiState()
        object Loading : UiState()
        object Success : UiState()
        object SuccessLogout : UiState()
        object Authenticated : UiState()
        object Unauthenticated : UiState()
        data class Error(
            val code: String? = null,
            val message: String
        ) : UiState()
        object SuccessWaitVerification : UiState()
    }

    private val _uiState= MutableStateFlow<UiState>(UiState.Idle)
    val uiState: StateFlow<UiState> = _uiState

    fun register(
        username: String,
        name: String,
        surname: String,
        email: String,
        password: String,
        confirmPassword: String,
        phoneNumber: String,
        day: String,
        month: String,
        year: String,
        consent_status: Boolean
    ){
        viewModelScope.launch {
            _uiState.value = UiState.Loading

            val validationError = validateRegister(username, name, surname, email, password, phoneNumber, day, month, year,consent_status)

            if(validationError != null){
                _uiState.value = validationError
                return@launch
            }

            if(password != confirmPassword){
                _uiState.value = UiState.Error("INVALID_CONFIRM", message="Passwords do not match")
                return@launch
            }

            val dob = "$year-$month-$day"


            repository.register(username, name, surname, email, password, phoneNumber, dob, consent_status).fold(
                onSuccess = {
                    _uiState.value = UiState.SuccessWaitVerification
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

    fun login(
        identifier: String,
        password: String
    ){
        viewModelScope.launch {
            _uiState.value = UiState.Loading

            val validationError = validateLogin(identifier,password)

            if(validationError != null){
                _uiState.value = validationError
                return@launch
            }

            repository.login(identifier, password).fold(
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

    fun logout(){
        viewModelScope.launch {
            _uiState.value = UiState.Loading

            repository.logout().fold(
                onSuccess = {
                    _uiState.value = UiState.SuccessLogout
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

    fun checkSession(){
        viewModelScope.launch {
            _uiState.value = UiState.Loading
            val refreshToken = repository.getRefreshToken()

            if(refreshToken == null){
                _uiState.value = UiState.Unauthenticated
                return@launch
            }

            repository.getProfile().fold(
                onSuccess = {
                    _uiState.value = UiState.Authenticated
                },
                onFailure = {
                    _uiState.value = UiState.Unauthenticated
                }
            )
        }
    }

    fun validateLogin(identifier: String, password: String): UiState.Error?{
        if (identifier.isBlank()) return UiState.Error("INVALID_CREDENTIALS","Email or Username is required")
        if (password.isBlank()) return UiState.Error("INVALID_PASSWORD","Password is required")

        return null
    }

    fun validateRegister(
         username: String,
         name: String,
         surname: String,
         email: String,
         password: String,
         phoneNumber: String,
         day: String,
         month: String,
         year: String,
         consent_status: Boolean
    ): UiState.Error?{

        if (username.isBlank()) return UiState.Error("INVALID_NAME","Name is required")
        if (name.isBlank()) return UiState.Error("INVALID_NAME","Name is required")
        if (surname.isBlank()) return UiState.Error("INVALID_SURNAME","Surname is required")
        if (email.isBlank()) return UiState.Error("INVALID_EMAIL","Email is required")
        if (password.isBlank()) return UiState.Error("INVALID_PASSWORD","Password is required")
        if (phoneNumber.isBlank()) return UiState.Error("INVALID_PHONE","Phone number is required")
        if (!consent_status) return UiState.Error(message="You must accept the terms to register")

        val d = day.toIntOrNull() ?: return UiState.Error("INVALID_DAY","Invalid day")
        val m = month.toIntOrNull() ?: return UiState.Error("INVALID_MONTH","Invalid month")
        val y = year.toIntOrNull() ?: return UiState.Error("INVALID_YEAR","Invalid year")

        if (d !in 1..31) return UiState.Error("INVALID_DAY","Invalid day")
        if (m !in 1..12) return UiState.Error("INVALID_MONTH","Invalid month")
        if (y<1900) return UiState.Error("INVALID_YEAR","Invalid year")

        val dob = try{
            LocalDate.of(y,m,d)
        } catch( e: Exception){
            return UiState.Error(message="Invalid date of birth")
        }

        if (dob.isAfter(LocalDate.now())) return UiState.Error(message="Date of birth cannot be in the future")

        val age = Period.between(dob, LocalDate.now()).years
        if (age < 18) return UiState.Error(message="You must be at least 18 years old to register")

        return null
    }

}