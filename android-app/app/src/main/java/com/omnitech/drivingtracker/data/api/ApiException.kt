package com.omnitech.drivingtracker.data.api

class ApiException (
    val errorCode: String,
    val errorMessage: String? = null
): Exception(errorMessage)