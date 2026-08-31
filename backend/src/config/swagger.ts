import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'DrivingTracker API',
            version: '1.0.0',
            description: 'API for the Driving Tracker application',
        },
        servers: [
            { url: 'http://localhost:3000', description: 'Local dev'},
            ...(process.env.API_BASE_URL? [{ url: process.env.API_BASE_URL, description: 'Production'}] : []),
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                ErrorResponse: {
                    type: 'object',
                    required: ['error'],
                    properties: {
                        error: { type: 'string'},
                        message: { type: 'string' },
                    },
                },
                RateLimitResponse: {
                    type: 'object',
                    required: ['error'],
                    properties: {
                        error: { type: 'string', example: 'TOO_MANY_REQUESTS' },
                        message: { type: 'string', example: 'Too many requests, please try again later' },
                    },
                },
                NotificationItem: {
                    type: 'object',
                    required: ['notification_id', 'type', 'title', 'created_at'],
                    properties: {
                        notification_id: { type: 'string', example: 'noti-1' },
                        type: { type: 'string', example: 'contact_request' },
                        title: { type: 'string', example: 'Contact Request' },
                        body: { type: 'string', example: 'Someone requested you to be a contact' },
                        reference_id: { type: 'string', example: 'contact-1' },
                        reference_type: { type: 'string', example: 'trusted_contacts'  },
                        created_at: { type: 'string', format: 'date-time', example: '2026-03-03T00:00:00.000Z' },
                    },
                },
                VehicleSummary: {
                    type: 'object',
                    required: ['vehicle_id', 'name', 'registration', 'make', 'model',
                        'year', 'fuel_type', 'mileage', 'trip_count', 'avg_fuel_efficiency'
                    ],
                    properties: {
                        vehicle_id: { type: 'string', example: 'vehicle-1' },
                        name: { type: 'string', example: 'Family SUV' },
                        registration: { type: 'string', example: 'CA 1234' },
                        make: { type: 'string', example: 'Toyota' },
                        model: { type: 'string', example: 'Corolla' },
                        year: { type: 'integer', example: '2016'  },
                        fuel_type: { type: 'string', example: 'Petrol' },
                        mileage: { type: 'integer', example: 120600  },
                        trip_count: { type: 'integer', example: 9 },
                        avg_fuel_efficiency: { type: 'number', nullable: true, example: 8.3 },
                    },
                },
                VehicleRecord: {
                    type: 'object',
                    required: ['vehicle_id', 'name', 'make', 'model', 'year', 'fuel_type'],
                    properties: {
                        vehicle_id: { type: 'string', example: 'vehicle-1' },
                        name: { type: 'string', example: 'Family SUV' },
                        registration: { type: 'string', example: 'CA 1234' },
                        make: { type: 'string', example: 'Toyota' },
                        model: { type: 'string', example: 'RAV4' },
                        year: { type: 'integer', example: '2018'  },
                        fuel_type: { type: 'string', example: 'Petrol' },
                        fuel_tank: { type: 'number', example: 55 },
                        fuel_efficiency: { type: 'number', example: 8.3 },
                    },
                },
                TrustedContact: {
                    type: 'object',
                    required: ['contact_id', 'username', 'name', 'email'],
                    properties: {
                        contact_id: { type: 'string', example: 'contact-1' },
                        username: { type: 'string', example: 'johndoe67' },
                        name: { type: 'string', example: 'John Doe' },
                        email: { type: 'string', format: 'email', example: 'john@email.com' },
                    },
                },
                TrustedContactCreated: {
                    type: 'object',
                    required: ['contact_id', 'username'],
                    properties: {
                        contact_id: { type: 'string', example: 'contact-1' },
                        username: { type: 'string', example: 'johndoe67' },
                    },
                },
                ContactRequest: {
                    type: 'object',
                    required: ['contact_id', 'created_at', 'username'],
                    properties: {
                        contact_id: { type: 'string', example: 'contact-1' },
                        username: { type: 'string', example: 'johndoe67' },
                        created_at: { type: 'string', format: 'datetime', example: 'johndoe67' },
                    },
                },
                LocationShareResponse: {
                    type: 'object',
                    required: ['trip_id', 'shared_at', 'shared_with'],
                    properties: {
                        trip_id: { type: 'string', format: 'uuid' },
                        shared_at: { type: 'string', format: 'datetime', example: '2026-08-31T14:22:15.000Z' },
                        shared_with: {
                            type: 'array',
                            items: {
                                type: 'object',
                                required: ['contact_id', 'username'],
                                properties: {
                                    contact_id: { type: 'string', format: 'uuid' },
                                    username: { type: 'string', example: 'johndoe123' },
                                }
                            }
                        }
                    },
                },
                Trip: {
                    type: 'object',
                    required: ['trip_id', 'vehicle_id', 'user_id', 'start_time', 'status', 'data_source'],
                    properties: {
                        trip_id: { type: 'string', example: 'trip-1' },
                        vehicle_id: { type: 'string', example: 'vehicle-1' },
                        user_id: { type: 'string', example: 'user-1' },
                        start_time: { type: 'string', format: 'date-time', example: '2026-08-31T10:00:00.000Z' },
                        end_time: { type: 'string', format: 'date-time', nullable: true, example: '2026-08-31T11:00:00.000Z' },
                        status: { type: 'string', enum: ['IN_PROGRESS', 'COMPLETED', 'ABORTED'], example: 'IN_PROGRESS' },
                        data_source: { type: 'string', enum: ['OBD', 'PHONE'], example: 'PHONE' },
                        distance_km: { type: 'number', nullable: true, example: 25.5 },
                        duration_minutes: { type: 'integer', nullable: true, example: 90 },
                        fuel_estimate: { type: 'number', nullable: true, example: 2.1 },
                    }
                },
                TripHistoryItem: {
                    type: 'object',
                    required: ['trip_id', 'vehicle_id', 'start_time', 'status', 'distance_km', 'duration_minutes'],
                    properties: {
                        trip_id: { type: 'string', example: 'trip-1' },
                        vehicle_id: { type: 'string', example: 'vehicle-1' },
                        start_time: { type: 'string', format: 'date-time' },
                        end_time: { type: 'string', format: 'date-time', nullable: true },
                        status: { type: 'string', enum: ['IN_PROGRESS','COMPLETED', 'ABORTED'] },
                        distance_km: { type: 'number', example: 25.5 },
                        duration_minutes: { type: 'integer', example: 90 },
                        fuel_estimate: { type: 'number', nullable: true },
                    }
                },
                TripSummary: {
                    type: 'object',
                    properties: {
                        trip_id: { type: 'string' },
                        vehicle_id: { type: 'string' },
                        start_time: { type: 'string', format: 'date-time' },
                        end_time: { type: 'string', format: 'date-time', nullable: true },
                        status: { type: 'string', enum: ['IN_PROGRESS', 'COMPLETED', 'ABORTED'] },
                        distance_km: { type: 'number' },
                        duration_minutes: { type: 'integer' },
                        fuel_estimate: { type: 'number', nullable: true },
                        safety_score: { type: 'number', nullable: true },
                        eco_score: { type: 'number', nullable: true },
                        overall_score: { type: 'number', nullable: true },
                    }
                },
                StopEvent: {
                    type: 'object',
                    required: ['event_id', 'trip_id', 'location', 'stopped_at', 'status'],
                    properties: {
                        event_id: { type: 'string', format: 'uuid' },
                        trip_id: { type: 'string', format: 'uuid' },
                        location: {
                            type: 'object',
                                properties: {
                                    lat: { type: 'number' },
                                    lng: { type: 'number' },
                                }
                            },
                        stopped_at: { type: 'string', format: 'date-time' },
                        status: { type: 'string', enum: ['possible', 'confirmed', 'resolved_ok', 'resolved_moved'], example: 'possible' },
                        address: { type: 'string', nullable: true },
                    }
                },
            },
        },
        security: [{ bearerAuth: []}],
    },

    apis: process.env.NODE_ENV === 'production'
    ? ['./dist/routes/**/*.js'] 
    : ['./src/routes/**/*.ts'],

};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;