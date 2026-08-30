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