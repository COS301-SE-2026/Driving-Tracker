package com.omnitech.drivingtracker.ui.other
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.omnitech.drivingtracker.data.api.ApiException
import com.omnitech.drivingtracker.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel(){

    private val _deleteAccountState = MutableStateFlow<DeleteAccountState>(DeleteAccountState.Idle)
    val deleteAccountState: StateFlow<DeleteAccountState> = _deleteAccountState.asStateFlow()

    fun deleteAccount(password: String){
        viewModelScope.launch {
            _deleteAccountState.value = DeleteAccountState.Loading

            authRepository.deleteAccount(password)
                .onSuccess {
                    _deleteAccountState.value = DeleteAccountState.Success
                }
                .onFailure {
                    error ->
                    val message = (error as? ApiException)?.message ?: "Something went wrong"
                    _deleteAccountState.value = DeleteAccountState.Error(message)
                }
        }
    }

    fun resetDeleteAccountState(){
        _deleteAccountState.value = DeleteAccountState.Idle
    }
}

sealed class DeleteAccountState{
    object Idle: DeleteAccountState()
    object Loading: DeleteAccountState()
    object Success: DeleteAccountState()
    data class Error(val message: String) : DeleteAccountState()
}

