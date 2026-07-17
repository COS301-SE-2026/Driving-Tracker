package com.omnitech.drivingtracker.ui.notification

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.omnitech.drivingtracker.data.api.ApiException
import com.omnitech.drivingtracker.data.local.SessionManager
import com.omnitech.drivingtracker.data.models.ContactDto
import com.omnitech.drivingtracker.data.models.RespondContactRequest
import com.omnitech.drivingtracker.data.repository.NotificationsRepository
import com.omnitech.drivingtracker.ui.contacts.ContactsViewModel
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class NotificationViewModel @Inject constructor(private val repository: NotificationsRepository, private val sessionManager: SessionManager): ViewModel(){

    sealed class UiState{
        object Idle : UiState() //initial state
        object Loading : UiState() //fetching data
        data class SuccessContactReqResponse(val contactId: String, val message: String? = null) : UiState()
        //data class Success(val notifications: List<>) : UiState()//Got data
        data class Error(val code: String? = null, val message: String? = null) : UiState() //error occurred
    }

    //Expose state to UI as StateFlow
    private val _uiState = MutableStateFlow<UiState>(UiState.Idle)
    val uiState: StateFlow<UiState> = _uiState  //Read-only, UI observes this
    fun hasRequestedBefore(): Boolean = repository.hasRequestedBefore()

    fun markAsRequested() {
        repository.markAsRequested()
    }

    fun respondTrustedContactRequest(contactId: String, status: String) {
        viewModelScope.launch{
            _uiState.value = UiState.Loading

            repository.respondTrustedContactRequest(contactId, status).fold( //Call repository, get Result<List<ContactDto>>
                onSuccess = { response ->
                    _uiState.value = UiState.SuccessContactReqResponse(response.data.contactId, response.message)
                },
                onFailure = {exception ->
                    when{
                        exception is ApiException -> {
                            _uiState.value = UiState.Error(
                                code = exception.errorCode,
                                message = exception.errorMessage ?: "Something went wrong"
                            )
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