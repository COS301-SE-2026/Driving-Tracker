package com.omnitech.drivingtracker.ui.notification

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.omnitech.drivingtracker.data.api.ApiException
import com.omnitech.drivingtracker.data.local.SessionManager
import com.omnitech.drivingtracker.data.models.ContactDto
import com.omnitech.drivingtracker.data.models.NotificationDto
import com.omnitech.drivingtracker.data.models.RequestDto
import com.omnitech.drivingtracker.data.models.RespondContactRequest
import com.omnitech.drivingtracker.data.models.SharedWithMeDto
import com.omnitech.drivingtracker.data.repository.ContactsRepository
import com.omnitech.drivingtracker.data.repository.NotificationsRepository
import com.omnitech.drivingtracker.ui.contacts.ContactsViewModel
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
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

    data class NotificationUiState(
        val requests: List<RequestDto> = emptyList(),
        val groupedNotifications: Map<String, List<NotificationDto>> = emptyMap(),
        val trips: List<SharedWithMeDto> = emptyList(),
        val deleted: Int? = null,
        val isLoading: Boolean = false,
        val error: String? = null
    )
//    sealed class UiState{
//        object Idle : UiState() //initial state
//        object Loading : UiState() //fetching data
//        data class SuccessContactReqResponse(val contactId: String, val message: String? = null) : UiState()
//        data class SuccessPendingRequests(val requests: List<RequestDto>) : UiState()
//        data class SuccessNotifications(val groupedNotifications: Map<String, List<NotificationDto>>):  UiState()
//        //data class Success(val notifications: List<>) : UiState()//Got data
//        data class Error(val code: String? = null, val message: String? = null) : UiState() //error occurred
//    }

    //Expose state to UI as StateFlow
    private val _uiState = MutableStateFlow(NotificationUiState())
    val uiState: StateFlow<NotificationUiState> = _uiState.asStateFlow()  //Read-only, UI observes this
    fun hasRequestedBefore(): Boolean = repository.hasRequestedBefore()

    fun markAsRequested() {
        repository.markAsRequested()
    }

    fun resetDeleteStatus(){
        _uiState.update { it.copy(deleted = null) }
    }

    //Respond to a trusted contact request with Status "ACCEPTED" or "DENIED"
    fun respondTrustedContactRequest(contactId: String, status: String) {
        viewModelScope.launch{
            _uiState.update  { current ->
                current.copy(
                    requests = current.requests.filter { it.contactId != contactId }
                )
            }

            repository.respondTrustedContactRequest(contactId, status).fold(
                onSuccess = {
                    getContactRequests()
                    getNotifications()
                },
                onFailure = {exception ->
                    getContactRequests()

                    val errorMessage = when (exception) {
                        is ApiException ->  exception.errorMessage?: somethingWentWrongError
                        else -> exception.message ?: somethingWentWrongError
                    }
                    _uiState.update { it.copy( error = errorMessage, isLoading = false) }
                }
            )
        }
    }

    //Fetch pending received contact requests
    fun getContactRequests() {
        viewModelScope.launch{
            _uiState.update { it.copy(isLoading = true) }

            contactsRepository.getContactRequests().fold(
                onSuccess = { requests ->
                    _uiState.update { it.copy(requests = requests, isLoading = false)}
                },
                onFailure = {exception ->
                    when{
                        exception is ApiException -> {
                            _uiState.update { it.copy( error = exception.errorMessage?: somethingWentWrongError, isLoading = false) }
                        }
                        else -> {
                            _uiState.update { it.copy( error = exception.message?: somethingWentWrongError, isLoading = false) }
                        }
                    }
                }
            )
        }
    }

    fun getNotifications() {
        viewModelScope.launch{
            _uiState.update { it.copy(isLoading = true) }

            repository.getNotifications().fold(
                onSuccess = { notifications ->
                    val groupedNotifications = groupNotifications(notifications)
                    _uiState.update { it.copy(groupedNotifications = groupedNotifications, isLoading = false) }
                },
                onFailure = {exception ->
                    when{
                        exception is ApiException -> {
                            _uiState.update { it.copy( error = exception.errorMessage?: somethingWentWrongError, isLoading = false) }
                        }
                        else -> {
                            _uiState.update { it.copy( error = exception.message?: somethingWentWrongError, isLoading = false) }
                        }
                    }
                }
            )
        }
    }

    fun deleteNotifications() {
        viewModelScope.launch{

            if(_uiState.value.groupedNotifications.isEmpty()) return@launch

            _uiState.update { it.copy(isLoading = true) }

            repository.deleteNotifications().fold(
                onSuccess = { count ->
                    _uiState.update { it.copy(groupedNotifications = emptyMap(), deleted = count, isLoading = false) }
                },
                onFailure = {exception ->
                    when{
                        exception is ApiException -> {
                            _uiState.update { it.copy( error = exception.errorMessage?: somethingWentWrongError, isLoading = false) }
                        }
                        else -> {
                            _uiState.update { it.copy( error = exception.message?: somethingWentWrongError, isLoading = false) }
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

    fun getTripsSharedWithMe(){
        viewModelScope.launch{
            _uiState.update { it.copy(isLoading = true) }

            repository.getTripsSharedWithMe().fold(
                onSuccess = { trips ->
                    _uiState.update { it.copy(trips = trips, isLoading = false)}
                },
                onFailure = {exception ->
                    when{
                        exception is ApiException -> {
                            _uiState.update { it.copy( error = exception.errorMessage?: somethingWentWrongError, isLoading = false) }
                        }
                        else -> {
                            _uiState.update { it.copy( error = exception.message?: somethingWentWrongError, isLoading = false) }
                        }
                    }
                }
            )
        }
    }
}