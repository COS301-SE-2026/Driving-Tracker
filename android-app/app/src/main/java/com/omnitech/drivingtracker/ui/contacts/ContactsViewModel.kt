package com.omnitech.drivingtracker.ui.contacts

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.omnitech.drivingtracker.data.api.ApiException
import com.omnitech.drivingtracker.data.models.ContactDto
import com.omnitech.drivingtracker.data.repository.ContactsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class ContactsViewModel(private val repository: ContactsRepository): ViewModel(){
    //define UI state machine
    sealed class UiState{
        object Idle : UiState() //initial state
        object Loading : UiState() //fetching data
        data class Success(val contacts: List<ContactDto>) : UiState() //Got data
        data class Error(val code: String? = null, val message: String? = null) : UiState() //error occurred
    }

    // Expose state to UI as StateFlow
    private val _uiState = MutableStateFlow<UiState>(UiState.Idle)
    val uiState: StateFlow<UiState> = _uiState  // Read-only, UI observes this

    //load data function
    fun loadContacts(){
        viewModelScope.launch{
            _uiState.value = UiState.Loading

            repository.fetchContacts().fold( // Call repository, get Result<List<ContactDto>>
                onSuccess = { contacts ->
                    _uiState.value = UiState.Success(contacts)  // Update state with data
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

    fun createContact(identifier: String){
        viewModelScope.launch{
            _uiState.value = UiState.Loading
            repository.createContact(identifier).fold(
                onSuccess = {
                    loadContacts()
                },
                onFailure = { exception ->
                    when{
                        exception is ApiException -> {
                            _uiState.value = UiState.Error(
                                code = exception.errorCode,
                                message = exception.errorMessage ?: "Failed to add contact"
                            )
                        }
                        else -> {
                            _uiState.value = UiState.Error(
                                message = exception.message ?: "Failed to add contact"
                            )
                        }
                    }
                }
            )
        }
    }

    fun alertContacts(eventType: String, eventId: String?, message: String?, contactIds: List<String>){
        viewModelScope.launch{
            repository.alertContacts(eventType, eventId, message, contactIds).fold(
                onSuccess = {
                    loadContacts()
                },
                onFailure = { exception ->
                    when{
                        exception is ApiException -> {
                            _uiState.value = UiState.Error(
                                code = exception.errorCode,
                                message = exception.errorMessage ?: "Failed to alert contacts"
                            )
                        }
                        else -> {
                            _uiState.value = UiState.Error(
                                message = exception.message ?: "Failed to alert contacts"
                            )
                        }
                    }
                }
            )
        }
    }

    fun shareLocation(tripId: String, contactIds: List<String>){
        viewModelScope.launch{
            repository.shareLocation(tripId, contactIds).fold(
                onSuccess = {
                    loadContacts()
                },
                onFailure = { exception ->
                    when{
                        exception is ApiException -> {
                            _uiState.value = UiState.Error(
                                code = exception.errorCode,
                                message = exception.errorMessage ?: "Failed to share location"
                            )
                        }
                        else -> {
                            _uiState.value = UiState.Error(
                                message = exception.message ?: "Failed to share location"
                            )
                        }
                    }
                }
            )
        }
    }

    class ContactsViewModelFactory(private val repository: ContactsRepository) :
        ViewModelProvider.Factory {
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return ContactsViewModel(repository) as T
        }
    }

    //Autoload on creation
    init {
        loadContacts() // Fetch when ViewModel is created
    }
}