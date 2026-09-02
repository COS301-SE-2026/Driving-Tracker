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
                MapToken: {
                    type: 'object',
                    required: ['token', 'auth_type'],
                    properties: {
                        token: { type: 'string', example: 'AZURE_SUB_KEY' },
                        auth_type: { type: 'string', enum: ['subscriptionKey'], example: 'subscriptionKey' },
                    },
                },
                AddressSearchResult: {
                    type: 'object',
                    required: ['address', 'lat', 'lng'],
                    properties: {
                        address: { type: 'string', example: '123 Main Street, Pretoria, Hatfield, South Africa' },
                        lat: { type: 'number', example: 23.7128 },
                        lng: { type: 'number', example: -24.0060 },
                    }
                },
                RouteSummary: {
                    type: 'object',
                    required: ['distance_km', 'travel_time_seconds', 'traffic_delay_seconds', 'points'],
                    properties: {
                        distance_km: { type: 'number', example: 15.3 },
                        travel_time_seconds: { type: 'integer', example: 1245 },
                        traffic_delay_seconds: { type: 'integer', example: 180 },
                        points: {
                            type: 'array',
                            items: {
                                type: 'object',
                                required: ['lat', 'lng'],
                                properties: {
                                    lat: { type: 'number', example: 40.7128 },
                                    lng: { type: 'number', example: -74.0060 },
                                }
                            },
                            example: [
                                { lat: 40.7128, lng: -74.0060 },
                                { lat: 40.7150, lng: -74.0050 },
                                { lat: 40.7580, lng: -73.9855 }
                            ]
                        }
                    }
                },
                PointOfInterest: {
                    type: 'object',
                    required: ['name', 'latitude', 'longitude', 'distanceMeters'],
                    properties: {
                        name: { type: 'string', example: 'Shell Gas Station' },
                        category: { type: 'string', nullable: true, example: 'petrol' },
                        latitude: { type: 'number', example: 28.7150 },
                        longitude: { type: 'number', example: -24.0055 },
                        distanceMeters: { type: 'number', example: 250.5 },
                        address: { type: 'string', nullable: true, example: '100 Main St, Joburg, South Africa' },
                    }
                },
                AddressData: {
                    type: 'object',
                    properties: {
                        address: { type: 'string', nullable: true, example: '123 Main Street, Cape Town, WC, South Africa' },
                        road_use: {
                            type: 'array',
                            items: { type: 'string' },
                            nullable: true,
                            example: ['LimitedAccess','Arterial']
                        },
                        speed_limit: { type: 'string', nullable: true, example: '65 mph' },
                        municipality: { type: 'string', nullable: true, example: 'New York' },
                        countryCode: { type: 'string', nullable: true, example: 'US' },
                    }
                },
                LeaderboardEntry: {
                    type: 'object',
                    required: ['rank', 'user_id', 'display_name', 'score'],
                    properties: {
                        rank: { type: 'integer', example: 1 },
                        user_id: { type: 'string', format: 'uuid', example: 'user-1' },
                        display_name: { type: 'string', example: 'John Doe' },
                        score: { type: 'number', example: 95.5 },
                    }
                    },
                LeaderboardResponse: {
                    type: 'object',
                    required: ['category', 'scope', 'entries', 'my_rank', 'my_score'],
                    properties: {
                        category: { type: 'string', example: 'safety' },
                        scope: { type: 'string', example: 'global' },
                        entries: {
                        type: 'array',
                        items: {
                            $ref: '#/components/schemas/LeaderboardEntry'
                        },
                        example: [
                            {
                                rank: 1,
                                user_id: 'user-1',
                                display_name: 'Jane Smith',
                                score: 98.5
                            },
                            {
                                rank: 2,
                                user_id: 'user-2',
                                display_name: 'John Doe',
                                score: 95.5
                            },
                            {
                                rank: 3,
                                user_id: 'user-3',
                                display_name: 'Alice Johnson',
                                score: 92.0
                            }
                        ]
                        },
                        my_rank: { type: 'integer', nullable: true, example: 2 },
                        my_score: { type: 'number', example: 95.5 },
                    }
                },
                CategoriesResponse: {
                    type: 'object',
                    required: ['categories'],
                    properties: {
                        categories: {
                            type: 'array',
                            items: { type: 'string' },
                            example: ['safety', 'efficiency', 'eco_driving', 'speed_compliance']
                        }
                    }
                },
                ScopesResponse: {
                    type: 'object',
                    required: ['scopes'],
                    properties: {
                        scopes: {
                            type: 'array',
                            items: { type: 'string' },
                            example: ['global', 'regional', 'friends', 'country']
                        }
                    }
                },
                BadgeEarned: {
                    type: 'object',
                    required: ['badge_id', 'name', 'description', 'category', 'earned_at'],
                    properties: {
                        badge_id: { type: 'string', format: 'uuid', example: 'badge-1' },
                        name: { type: 'string', example: 'Safety Champion' },
                        description: { type: 'string', example: 'Achieved 90+ safety score on a trip' },
                        category: { type: 'string', example: 'safety' },
                        earned_at: { type: 'string', format: 'date-time', example: '2026-08-31T12:00:00.000Z' },
                        icon_url: { type: 'string', nullable: true, example: 'https://api.example.com/badges/safety_champion.png' },
                        current: { type: 'integer', example: 1 },
                    }
                },
                BadgeCategory: {
                    type: 'object',
                    required: ['category', 'current'],
                    properties: {
                        category: { type: 'string', example: 'safety' },
                        current: { type: 'integer', example: 3 },
                    }
                },
                BadgeSummary: {
                    type: 'object',
                    required: ['Total_earned', 'categories'],
                    properties: {
                        Total_earned: { type: 'integer', example: 5 },
                        categories: {
                        type: 'array',
                        items: {
                            $ref: '#/components/schemas/BadgeCategory'
                        }
                        }
                    }
                },
                UserBadgesResponse: {
                    type: 'object',
                    required: ['earned', 'summary'],
                    properties: {
                        earned: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/BadgeEarned'
                            },
                            example: [
                                {
                                    badge_id: 'badge-1',
                                    name: 'Safety Champion',
                                    category: 'safety',
                                    description: 'Achieved 90+ safety score on a trip',
                                    current: 1,
                                    earned_at: '2026-08-31T12:00:00.000Z'
                                },
                                {
                                    badge_id: 'badge-2',
                                    name: 'Eco Driver',
                                    category: 'efficiency',
                                    description: 'Maintained excellent fuel efficiency',
                                    current: 1,
                                    earned_at: '2026-08-30T15:30:00.000Z'
                                }
                            ]
                        },
                        summary: {
                            $ref: '#/components/schemas/BadgeSummary'
                        }
                    }
                },
                BadgeCriterion: {
                    type: 'object',
                    required: ['metric', 'operator', 'threshold'],
                    properties: {
                        metric: { type: 'string', example: 'safety_score' },
                        operator: { type: 'string', enum: ['>', '>=', '<', '<=', '=', '==', '!='], example: '>=' },
                        threshold: { type: 'number', nullable: true, example: 90 },
                        target: { type: 'number', nullable: true, example: 90 },
                    }
                },
                BadgeDefinition: {
                    type: 'object',
                    required: ['badge_id', 'name', 'description', 'category', 'criteria'],
                    properties: {
                        badge_id: { type: 'string', format: 'uuid', example: 'badge-1' },
                        name: { type: 'string', example: 'Safety Champion' },
                        description: { type: 'string', example: 'Achieved 90+ safety score on a trip' },
                        category: { type: 'string', example: 'safety' },
                        icon_url: { type: 'string', nullable: true, example: 'https://api.example.com/badges/safety_champion.png' },
                        criteria: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/BadgeCriterion'
                            }
                        }
                    }
                },

                BadgeDefinitionsResponse: {
                    type: 'object',
                    required: ['badges'],
                    properties: {
                        badges: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/BadgeDefinition'
                            },
                            example: [
                                {
                                    badge_id: 'badge-1',
                                    name: 'Safety Champion',
                                    description: 'Achieved 90+ safety score on a trip',
                                    category: 'safety',
                                    icon_url: 'https://api.example.com/badges/safety_champion.png',
                                    criteria: [
                                        {
                                        metric: 'safety_score',
                                        operator: '>=',
                                        threshold: 90,
                                        target: null
                                        }
                                    ]
                                },
                                {
                                    badge_id: 'badge-2',
                                    name: 'Eco Driver',
                                    description: 'Maintained excellent fuel efficiency',
                                    category: 'efficiency',
                                    icon_url: 'https://api.example.com/badges/eco_driver.png',
                                    criteria: [
                                        {
                                        metric: 'eco_score',
                                        operator: '>=',
                                        threshold: 85,
                                        target: null
                                        },
                                        {
                                        metric: 'distance_km',
                                        operator: '>',
                                        threshold: 10,
                                        target: null
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                },
                BadgeEvaluationResponse: {
                    type: 'object',
                    required: ['evaluated', 'new_badges'],
                    properties: {
                        evaluated: { type: 'boolean', example: true },
                        new_badges: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/BadgeEarned'
                            },
                            example: [
                                {
                                    badge_id: 'badge-3',
                                    name: 'Long Distance Driver',
                                    description: 'Completed a 50km+ trip',
                                    category: 'distance',
                                    earned_at: '2026-08-31T13:15:00.000Z',
                                    icon_url: 'https://api.example.com/badges/long_distance.png',
                                    current: 1
                                }
                            ]
                        }
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