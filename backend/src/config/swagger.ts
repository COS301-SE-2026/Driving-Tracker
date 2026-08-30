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