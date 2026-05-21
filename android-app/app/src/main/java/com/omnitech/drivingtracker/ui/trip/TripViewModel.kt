package com.omnitech.drivingtracker.ui.trip

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.omnitech.drivingtracker.data.api.ApiException
import com.omnitech.drivingtracker.data.models.ContactDto
import com.omnitech.drivingtracker.data.repository.ContactsRepository
import com.omnitech.drivingtracker.data.repository.TripRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch


class TripViewModel(
    private val tripRepository: TripRepository,
    private val contactsRepository: ContactsRepository
) : ViewModel(){

    sealed class UiState{
        object Idle : UiState()
        object Loading : UiState()
        data class Success(val data: String = "") : UiState() // trip_id
        data class Error(
            val code: String? = null,
            val message: String? = null
        ) : UiState()
    }

    private val _approvedContactsState = MutableStateFlow<UiState>(UiState.Idle)
    val approvedContactsState : StateFlow<UiState> = _approvedContactsState

    private val _tripStartState = MutableStateFlow<UiState>(UiState.Idle)
    val tripStartState: StateFlow<UiState> = _tripStartState

    init{
        loadApprovedContacts()
    }

    fun loadApprovedContacts(){
        viewModelScope.launch{
            _approvedContactsState.value = UiState.Loading

            contactsRepository.fetchApprovedContacts().fold(
                onSuccess = {contacts ->
                    _approvedContactsState.value = UiState.Success(contacts.toString())
                },
                onFailure = {exception ->
                    when{
                        exception is ApiException -> {
                            _approvedContactsState.value = UiState.Error(
                                code = exception.errorCode,
                                message = exception.errorMessage?: "Failed to load approved contacts"
                            )
                        }
                        else -> {
                            _approvedContactsState.value = UiState.Error(
                                message = exception.message ?: "Unknown error"
                            )
                        }
                    }
                }
            )
        }
    }

    fun startTrip(
        vehicleId: String,
        dataSource: String,
        latitude: Double,
        longitude: Double,
        selectedContactIds: List<String>?
    ){
        viewModelScope.launch {
            _tripStartState.value = UiState.Loading

            tripRepository.startTrip(vehicleId, dataSource, latitude, longitude, selectedContactIds).fold(
                onSuccess = { tripId ->
                    _tripStartState.value = UiState.Success(tripId)
                },
                onFailure = { exception ->
                    when {
                        exception is ApiException -> {
                            _tripStartState.value = UiState.Error(
                                code = exception.errorCode,
                                message = exception.errorMessage ?: "Failed to start trip"
                            )
                        }
                        else -> {
                            _tripStartState.value = UiState.Error(
                                message = exception.message ?: "Unknown error"
                            )
                        }
                    }
                }
            )
        }
    }

    class TripViewModelFactory(
        private val tripRepository: TripRepository,
        private val contactsRepository: ContactsRepository
    ) : ViewModelProvider.Factory {
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return TripViewModel(tripRepository, contactsRepository) as T
        }
    }
}