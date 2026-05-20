package com.omnitech.drivingtracker.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.omnitech.drivingtracker.data.api.ApiException
import com.omnitech.drivingtracker.data.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.Period

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
        phoneNumber: String,
        day: String,
        month: String,
        year: String,
        consentStatus: Boolean
    ){
        viewModelScope.launch {
            _uiState.value = UiState.Loading

            val validationError = validate(username, name, surname, email, password, phoneNumber, day, month, year,consentStatus)

            if(validationError != null){
                _uiState.value = UiState.Error(message = validationError)
                return@launch
            }

            val dob = "$year-$month-$day"
            repository.register(username, name, surname, email, password, phoneNumber, dob, consentStatus).fold(
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

    fun validate(
         username: String,
         name: String,
         surname: String,
         email: String,
         password: String,
         phoneNumber: String,
         day: String,
         month: String,
         year: String,
         consentStatus: Boolean
    ): String?{

        if (username.isBlank()) return "Username is required"
        if (name.isBlank()) return "First name is required"
        if (surname.isBlank()) return "Surname is required"
        if (email.isBlank()) return "Email is required"
        if (password.isBlank()) return "Password is required"
        if (phoneNumber.isBlank()) return "Phone number is required"
        if (!consentStatus) return "You must accept the terms to register"

        val d = day.toIntOrNull() ?: return "Invalid day"
        val m = month.toIntOrNull() ?: return "Invalid month"
        val y = year.toIntOrNull() ?: return "Invalid year"

        if (d !in 1..31) return "Invalid day"
        if (m !in 1..12) return "Invalid month"
        if (y<1900) return "Invalid year"

        val dob = try{
            LocalDate.of(y,m,d)
        } catch( e: Exception){
            return "Invalid date of birth"
        }

        if (dob.isAfter(LocalDate.now())) return "Date of birth cannot be in the future"

        val age = Period.between(dob, LocalDate.now()).years
        if (age < 18) return "You must be at least 18 years old to register"

        return null
    }

}