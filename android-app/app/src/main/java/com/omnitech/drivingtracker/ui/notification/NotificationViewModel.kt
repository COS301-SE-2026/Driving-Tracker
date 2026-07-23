package com.omnitech.drivingtracker.ui.notification

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.omnitech.drivingtracker.data.api.ApiException
import com.omnitech.drivingtracker.data.local.SessionManager
import com.omnitech.drivingtracker.data.models.ContactDto
import com.omnitech.drivingtracker.data.models.NotificationDto
import com.omnitech.drivingtracker.data.models.RequestDto
import com.omnitech.drivingtracker.data.models.RespondContactRequest
import com.omnitech.drivingtracker.data.repository.ContactsRepository
import com.omnitech.drivingtracker.data.repository.NotificationsRepository
import com.omnitech.drivingtracker.ui.contacts.ContactsViewModel
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.ZoneId
import java.time.Instant
import javax.inject.Inject

@HiltViewModel
class NotificationViewModel @Inject constructor(private val repository: NotificationsRepository,
    private val contactsRepository: ContactsRepository,
    private val sessionManager: SessionManager): ViewModel(){

    val somethingWentWrongError = "Something went wrong"
    sealed class UiState{
        object Idle : UiState() //initial state
        object Loading : UiState() //fetching data
        data class SuccessContactReqResponse(val contactId: String, val message: String? = null) : UiState()
        data class SuccessPendingRequests(val requests: List<RequestDto>) : UiState()
        data class SuccessNotifications(val groupedNotifications: Map<String, List<NotificationDto>>):  UiState()
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

    //Respond to a trusted contact request with Status "ACCEPTED" or "DENIED"
    fun respondTrustedContactRequest(contactId: String, status: String) {
        viewModelScope.launch{
            _uiState.value = UiState.Loading

            repository.respondTrustedContactRequest(contactId, status).fold(
                onSuccess = { response ->
                    _uiState.value = UiState.SuccessContactReqResponse(response.data.contactId, response.message)
                    getContactRequests()
                },
                onFailure = {exception ->
                    when{
                        exception is ApiException -> {
                            _uiState.value = UiState.Error(
                                code = exception.errorCode,
                                message = exception.errorMessage ?: somethingWentWrongError
                            )
                        }
                        else -> {
                            _uiState.value = UiState.Error(
                                message = exception.message ?: somethingWentWrongError
                            )
                        }
                    }
                }
            )
        }
    }

    //Fetch pending received contact requests
    fun getContactRequests() {
        viewModelScope.launch{
            _uiState.value = UiState.Loading

            contactsRepository.getContactRequests().fold(
                onSuccess = { requests ->
                    _uiState.value = UiState.SuccessPendingRequests(requests)
                },
                onFailure = {exception ->
                    when{
                        exception is ApiException -> {
                            _uiState.value = UiState.Error(
                                code = exception.errorCode,
                                message = exception.errorMessage ?: somethingWentWrongError
                            )
                        }
                        else -> {
                            _uiState.value = UiState.Error(
                                message = exception.message ?: somethingWentWrongError
                            )
                        }
                    }
                }
            )
        }
    }

    fun getNotifications() {
        viewModelScope.launch{
            _uiState.value = UiState.Loading

            repository.getNotifications().fold(
                onSuccess = { notifications ->
                    val groupedNotifications = groupNotifications(notifications)
                    _uiState.value = UiState.SuccessNotifications(groupedNotifications)
                },
                onFailure = {exception ->
                    when{
                        exception is ApiException -> {
                            _uiState.value = UiState.Error(
                                code = exception.errorCode,
                                message = exception.errorMessage ?: somethingWentWrongError
                            )
                        }
                        else -> {
                            _uiState.value = UiState.Error(
                                message = exception.message ?: somethingWentWrongError
                            )
                        }
                    }
                }
            )
        }
    }

    fun groupNotifications(notifications: List<NotificationDto>): Map<String, List<NotificationDto>>{
        val zoneId = ZoneId.systemDefault()
        val today = LocalDate.now(zoneId)
        val yesterday = today.minusDays(1)
        val startOfWeek = today.minusDays(today.dayOfWeek.value.toLong() - 1)

        return notifications.groupBy { notification ->
            val date = Instant.parse(notification.createdAt).atZone(zoneId).toLocalDate()

            when {
                date == today -> "Today"
                date == yesterday -> "Yesterday"
                !date.isBefore(startOfWeek) -> "This Week"
                else -> "Earlier"
            }
        }
    }
}