//import { PrismaClient } from '@prisma/client';
import prisma from '../src/db/prisma';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';
import {
  startOfMonth,
  startOfWeek,
} from 'date-fns';

//SA coordinates (coordinates for SA only)
const SACords = {
    lat: { min: -34.8333, max: -22.1250 },
    lng: { min: 16.4583, max:32.8916 }
};

//helper to generate coordinates
function getSAloc() {
    return {
        lat: faker.number.float({ min: SACords.lat.min, max: SACords.lat.max, fractionDigits: 6 }),
        lng: faker.number.float({ min: SACords.lng.min, max: SACords.lng.max, fractionDigits: 6 })
    };
}
function getTestLoc() {
    return {
        lat: faker.number.float({ min: -26.148, max: -26.138, fractionDigits: 6 }),
        lng: faker.number.float({ min: 27.837, max: 27.847, fractionDigits: 6 })
    };
}

async function main() {

    console.log('Start seeding....');

    //Our constant user
    const plainTextPassword = process.env.SEED_USER_PASSWORD;

    if (!plainTextPassword){
        throw new Error("SEED_USER_PASSWORD is not set. Add to env");
    }

    const hashedPassword = bcrypt.hashSync(plainTextPassword, 10);

    const myLoginUser = await prisma.users.upsert({
        where: { email: 'omnitech@gmail.com' },
        update: {},
        create: {
            username: 'Omn1t3ch',
            name: 'Omnitech',
            surname: 'Omnitech',
            email : 'omnitech@gmail.com',
            password_hash : hashedPassword,
            role: 'ADMIN',
            dob: faker.date.birthdate({ min: 18, max: 75, mode: 'age' }),
            phone_number: `+27${faker.number.int({ min: 600000000, max: 899999999 })}`,
            consent_status: true,
            status: 'ACTIVE',
            email_verified: true,
        }
    });

    const membership = await prisma.organization_members.findUnique({
        where: {user_id: myLoginUser.user_id},
    });

    if (membership){
        await prisma.organization_members.update(
            {
                where: {user_id: myLoginUser.user_id},
                data: {role: 'ADMIN'},
            }
        );
    }
    else {
        let organization = await prisma.organizations.findFirst({
            where: {name: 'Local Dashboard Org'},
        });

        if (!organization){
            organization = await prisma.organizations.create({
                data: {name: 'Local Dashboard Org'},
            });
        }

        await prisma.organization_members.create({
            data: {
                org_id: organization.org_id,
                user_id: myLoginUser.user_id,
                role: 'ADMIN',
            },
        });
    }

    const myLoginUser2 = await prisma.users.upsert({
        where: { email: 'dan.harbor@gmail.com' },
        update: { email_verified: true },
        create: {
            username: 'DanHarbor',
            name: 'Dan',
            surname: 'Harbor',
            email : 'dan.harbor@gmail.com',
            password_hash : hashedPassword,
            role: 'USER',
            dob: faker.date.birthdate({ min: 18, max: 75, mode: 'age' }),
            phone_number: `+27${faker.number.int({ min: 600000000, max: 899999999 })}`,
            consent_status: true,
            status: 'ACTIVE',
            email_verified: true,
        }
    });

    console.log(`Seeded our login user: ${myLoginUser.email} (Password: ${plainTextPassword})`);

    //making sure our user has a vehicle
    let myVehicle = null ;
    const myAssignment = await prisma.users_vehicles.findFirst({
        where: { user_id: myLoginUser.user_id},
        include:{ vehicles: true}
    });
    if(myAssignment){
        myVehicle = myAssignment.vehicles;
    }
    if(!myVehicle){
        myVehicle = await prisma.vehicles.create({
            data: {
                registration: 'DRIVER1',
                make: 'BMW',
                model: 'M3',
                year: 2024,
                fuel_type: 'PETROL',
                fuel_tank: 50
            }
        });
        await prisma.users_vehicles.create({
            data: {
                user_id: myLoginUser.user_id,
                vehicle_id: myVehicle.vehicle_id
            }
        });
        console.log(`Seeded vehicle for Omnitech`);
    }
    // let myVehicle = await prisma.vehicles.findFirst({
    //     where: { user_id: myLoginUser.user_id }
    // });

    // if (!myVehicle) {
    //     myVehicle = await prisma.vehicles.create({
    //         data: {
    //             user_id: myLoginUser.user_id,
    //             registration: 'DRIVER1',
    //             make: 'BMW',
    //             model: 'M3',
    //             year: 2024,
    //             fuel_type: 'PETROL',
    //         }
    //     });
    //     console.log(`Seeded vehicle for Omnitech`);
    // }

    //making sure Omnitech has contacts
    const contactCount = await prisma.trusted_contacts.count({
        where: { user_id: myLoginUser.user_id }
    });

    if (contactCount < 4) {
        const contactsNeeded = 4 - contactCount;
        for (let i = 0; i < contactsNeeded; i++) {
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();

            const contactUser = await prisma.users.create({
                data: {
                    username: faker.internet.username({ firstName, lastName }) + faker.number.int(1000),
                    name: firstName,
                    surname: lastName,
                    email: faker.internet.email({ firstName, lastName }),
                    password_hash: hashedPassword,
                    role: 'USER',
                    dob: faker.date.birthdate({ min: 18, max: 75, mode: 'age' }),
                    phone_number: `+27${faker.number.int({ min: 600000000, max: 899999999 })}`,
                    consent_status: true,
                    status: 'ACTIVE'
                }
            });

            //linking as trusted contacts
            await prisma.trusted_contacts.create({
                data: {
                    user_id: myLoginUser.user_id,
                    contact_user_id: contactUser.user_id,
                    name: `${contactUser.name} ${contactUser.surname}`,
                    relationship: faker.helpers.arrayElement(['Family', 'Friend', 'Spouse', 'Sibling']),
                    email: contactUser.email,
                    phone: faker.phone.number({ style: 'national' }),//SA numbers
                    consent_status: 'APPROVED',
                    alert_preferences: {
                        create: { on_crash: true, on_trip_end: false, on_unexpected_stop: true }
                    }
                }
            });
        }
        console.log(`Seeded ${contactsNeeded} Contacts for Omnitech`);
    } else{
        console.log(`Verified 4+ Contacts exist for Omnitech`)
    }

    //Ensuring the login user has a seeded trip set only once
    const tripCount = await prisma.trips.count({
        where: { user_id: myLoginUser.user_id }
    });

    if (tripCount === 0) {
        for (let i = 0; i < 3; i++) {
            const startLoc = getSAloc();
            const endLoc = getSAloc();

            await prisma.trips.create({
                data: {
                    user_id: myLoginUser.user_id,
                    vehicle_id: myVehicle.vehicle_id,
                    start_latitude: startLoc.lat,
                    start_longitude: startLoc.lng,
                    end_latitude: endLoc.lat,
                    end_longitude: endLoc.lng,
                    distance_km: faker.number.float({ min: 5, max: 150, fractionDigits: 2 }),
                    duration_minutes: faker.number.int({ min: 10, max: 180 }),
                    fuel_estimate: faker.number.float({ min: 1, max: 15, fractionDigits: 2 }),
                    data_source: 'PHONE',
                    status: 'COMPLETED',

                    trip_scores: {
                        create: {
                            safety_score: faker.number.float({ min: 60, max: 100, fractionDigits: 2 }),
                            eco_score: faker.number.float({ min: 50, max: 100, fractionDigits: 2 }),
                            overall_score: faker.number.float({ min: 65, max: 100, fractionDigits: 2 })
                        }
                    }
                }
            });
        }
        console.log(`Seeded 3 Trips for Omnitech`);
    } else {
        console.log(`Verified seeded trips already exist for Login User`)
    }

    //Creating 10 users without duplication
    let allUsersCount =  await prisma.users.count();
    if (allUsersCount < 11) {//1 Omnitech + 10 Random
        const usersNeeded = 11 - allUsersCount;
        for (let i = 0; i < usersNeeded; i++){
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            await prisma.users.create({
                data: {
                    username: faker.internet.username({ firstName, lastName }) + faker.number.int(1000),
                    name: firstName,
                    surname: lastName,
                    email: faker.internet.email({ firstName, lastName }),
                    password_hash: faker.internet.password(),
                    role: 'USER',
                    dob: faker.date.birthdate({ min: 18, max: 75, mode: 'age' }),
                    phone_number: `+27${faker.number.int({ min: 600000000, max: 899999999 })}`,
                    consent_status: true,
                    status: 'ACTIVE'
                }
            });

        }
        console.log(`Seeded ${usersNeeded} users`);
    }

    //Weekly challenges
    const challengeStart = new Date();
    const challengeEnd = new Date(challengeStart);
    challengeEnd.setDate(challengeEnd.getDate() + 7);

    const weeklyChallengesSeed = [
        {
            name: 'Safety Officer',
            description: 'Complete 4 trips without bad driving habits',
            target_trips: 4,
            active: true,
            start_date: challengeStart,
            end_date: challengeEnd,
        },
        {
            name: 'Speed Angel',
            description: 'Complete 3 trips with an average speed below 80km/h',
            target_trips: 3,
            active: true,
            start_date: challengeStart,
            end_date: challengeEnd,
        },
        {
            name: 'Throttle Goat',
            description: 'Complete 5 trips without a hard acceleration event',
            target_trips: 5,
            active: true,
            start_date: challengeStart,
            end_date: challengeEnd,
        },
    ];

    const weeklyChallengeIdByName = new Map<string, string>();
    for (const challenge of weeklyChallengesSeed) {
        const saved = await prisma.weekly_challenges.upsert({
            where: { name: challenge.name },
            update: {
                description: challenge.description,
                target_trips: challenge.target_trips,
                active: challenge.active,
                start_date: challenge.start_date,
                end_date: challenge.end_date,
            },
            create: challenge,
        });
        weeklyChallengeIdByName.set(challenge.name, saved.challenge_id);
    }
    console.log(`Seeded/updated 3 weekly challenges`);

    //Badge assets
    const badgeSeeds = [
        {
            name: 'First Drive',
            description: 'Complete your very first trip',
            category: 'MILESTONE',
            icon_url: 'badge_first_drive',
            weeklyChallengeName: null,
            criterion: { metric: 'completed_trip_count', operator: '>=', threshold: 1, target: 1 },
        },
        {
            name: 'On Board',
            description: 'Connect to the OBD device for the first time',
            category: 'MILESTONE',
            icon_url: 'badge_on_board',
            weeklyChallengeName: null,
            criterion: { metric: 'obd_connection_count', operator: '>=', threshold: 1, target: 1 },
        },
        {
            name: 'Safety Officer',
            description: 'No harsh driving events for 4 trips',
            category: 'SAFETY',
            icon_url: 'badge_safety_officer',
            weeklyChallengeName: 'Safety Officer',
            criterion: { metric: 'safe_trips_count', operator: '>=', threshold: 4, target: 4 },
        },
        {
            name: 'Speed Angel',
            description: 'Keep an average speed below 80km/h for 3 trips',
            category: 'SAFETY',
            icon_url: 'badge_speed_angel',
            weeklyChallengeName: 'Speed Angel',
            criterion: { metric: 'low_speed_trips_count', operator: '>=', threshold: 3, target: 3 },
        },
         {
            name: 'Throttle Goat',
            description: 'No hard acceleration events for 5 trips',
            category: 'SAFETY',
            icon_url: 'badge_throttle_goat',
            weeklyChallengeName: 'Throttle Goat',
            criterion: { metric: 'smooth_accel_trips_count', operator: '>=', threshold: 5, target: 5 },
        },
    ];

    for (const badgeSeed of badgeSeeds) {
        const weekly_challenge_id = badgeSeed.weeklyChallengeName
            ? weeklyChallengeIdByName.get(badgeSeed.weeklyChallengeName) ?? null
            : null;
        
        const badge = await prisma.badges.upsert({
            where: { name: badgeSeed.name },
            update: {
                description: badgeSeed.description,
                category: badgeSeed.category,
                icon_url: badgeSeed.icon_url,
                weekly_challenge_id,
            },
            create: {
                name: badgeSeed.name,
                description: badgeSeed.description,
                category: badgeSeed.category,
                icon_url: badgeSeed.icon_url,
                weekly_challenge_id,
            },
        });

        //Keeping criteria idempotent by deleting existing criteria and recreating them
        await prisma.badge_criteria.deleteMany({ where: { badge_id: badge.badge_id } });
        await prisma.badge_criteria.create({
            data: {
                badge_id: badge.badge_id,
                metric: badgeSeed.criterion.metric,
                operator: badgeSeed.criterion.operator,
                threshold: badgeSeed.criterion.threshold,
                target: badgeSeed.criterion.target,
            },
        });
    }
    console.log(`Seeded/updated ${badgeSeeds.length} badges from drawable assets`)
    
    const badges = await prisma.badges.findMany();
    const users = await prisma.users.findMany();
    //Creating leaderboard entries & user badges
    const leaderboardCount = await prisma.leaderboard.count();
    if (leaderboardCount < 10) {
        for (const user of users) {
            //Checking if user already has a leaderboard to avoid unique constraint crashes
            const existingBoard = await prisma.leaderboard.findFirst({ where: { user_id: user.user_id }});
            if (!existingBoard) {

                const scope = faker.helpers.arrayElement(['WEEKLY', 'MONTHLY', 'ALL_TIME']);

                const period_start = 
                    scope === 'ALL_TIME'? new Date('1970-01-01T00:00:00.000Z')
                    :scope === 'WEEKLY'? startOfWeek(new Date()): startOfMonth(new Date());
                await prisma.leaderboard.create({
                    data: {
                        user_id: user.user_id,
                        category: faker.helpers.arrayElement(['SAFETY', 'ECO', 'OVERALL']),
                        scope: faker.helpers.arrayElement(['WEEKLY', 'MONTHLY', 'ALL_TIME']),
                        score: faker.number.float({ min: 50, max: 100, fractionDigits: 2 }),
                        period_start,
                    }
                });

                //assigning random badges only they don't have
                const userBadges = faker.helpers.arrayElements(badges, 2);
                for (const b of userBadges) {
                    await prisma.user_badges.create({
                        data: { user_id: user.user_id, badge_id: b.badge_id }
                    }).catch(() => {});
                }
            }
        }
        console.log(`Seeded Leaderboards and User badges`);
    }
    
    

    //Creating trusted contacts (linking random users together)
    const contacts: any[] = [];
    const seenContactPairs = new Set<string>();
    let attemptCount = 0;
    const maxAttempts = 50; 

    while (contacts.length < 8 && attemptCount <maxAttempts) {
        attemptCount++;
        //picking 2 diff users
        const owner = faker.helpers.arrayElement(users);
        let contactUser = faker.helpers.arrayElement(users);
        while (owner.user_id === contactUser.user_id) contactUser = faker.helpers.arrayElement(users);

        const pairKey = `${owner.user_id}:${contactUser.user_id}`;
        if (seenContactPairs.has(pairKey)) {
            continue;
        }

        // Avoid creating a duplicate pair that may already exist in the DB
        const existingPair = await prisma.trusted_contacts.findFirst({
            where: { user_id: owner.user_id, contact_user_id: contactUser.user_id }
        });

        if (existingPair) {
            // record that we've seen this pair in this run and skip creating it
            seenContactPairs.add(pairKey);
            continue;
        }

        const contact = await prisma.trusted_contacts.create({
            data: {
                user_id: owner.user_id,
                contact_user_id: contactUser.user_id,
                name: `${contactUser.name} ${contactUser.surname}`,
                relationship: faker.helpers.arrayElement(['Family', 'Friend', 'Spouse']),
                email: contactUser.email,
                phone: faker.phone.number({ style: 'national' }), //SA numbers
                consent_status: 'APPROVED',
                alert_preferences: {
                    create: { on_crash: true, on_trip_end: false, on_unexpected_stop: true }
                }
            }
        });

        contacts.push(contact);
        seenContactPairs.add(pairKey);
    }
    console.log(`Seeded Trusted Contacts and Alert Preferences`);
    console.log(`Seed fleet drivers & vehicles for "local dashboard Org"`);
    let fleet_org = await prisma.organizations.findFirst({
        where:{ name:'Local Dashboard Org'}
    });
    if (!fleet_org) {
        fleet_org = await prisma.organizations.create({
            data: { name: 'Local Dashboard Org' },
        });
    }

    await prisma.organization_members.upsert({
        where: { user_id: myLoginUser.user_id },
        update: { org_id: fleet_org.org_id, role: 'ADMIN' },
        create: {
            org_id: fleet_org.org_id,
            user_id: myLoginUser.user_id,
            role: 'ADMIN',
        },
    });

    const fleet_drivers = [
        { name: 'Noah', surname: 'Beck', email: 'noah.beck@omnitech.com', username: 'noahbeck' },
        { name: 'Sipho', surname: 'Man', email: 'sipho.man@omnitech.com', username: 'siphoman' },
        { name: 'Ally', surname: 'Jackson', email: 'ally.jackson@omnitech.com', username: 'allyjackson' },
        { name: 'Jane', surname: 'Doe', email: 'jane.doe@omnitech.com', username: 'janedoe' },
    ];
    for(const d of fleet_drivers){
        const driver_user = await prisma.users.upsert({
            where: {email:d.email},
            update:{ email_verified: true,status:'ACTIVE'},
            create: {
                username: d.username,
                name: d.name,
                surname: d.surname,
                email: d.email,
                password_hash: hashedPassword,
                role: 'USER',
                dob: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
                phone_number: `+27${faker.number.int({ min: 600000000, max: 899999999 })}`,
                consent_status: true,
                status: 'ACTIVE',
                email_verified: true,
            },
        });    
        await prisma.organization_members.upsert({
            where: { user_id: driver_user.user_id },
            update: { org_id: fleet_org.org_id, role: 'DRIVER' },
            create: {
                org_id: fleet_org.org_id,
                user_id: driver_user.user_id,
                role: 'DRIVER',
            },
        });
    }
    console.log(`seed ${fleet_drivers.length} fleet drivers for ${fleet_org.name}`);
    const fleet_vehicles = [
        { name: 'Car1', registration: 'TOY-101-GP', make: 'Toyota', model: 'Hilux', year: 2022, fuel_type: 'DIESEL', fuel_tank: 80 },
        { name: 'Van1', registration: 'FRD-102-GP', make: 'Ford', model: 'Ranger', year: 2023, fuel_type: 'DIESEL', fuel_tank: 80 },
        { name: 'Bakkie1', registration: 'NIS-103-GP', make: 'Nissan', model: 'NP200', year: 2021, fuel_type: 'PETROL', fuel_tank: 50 },
    ];
    for( const v of fleet_vehicles){
        const existing_vehicle = await prisma.vehicles.findFirst({
            where: {registration : v.registration},
        });
        if (!existing_vehicle) {
            await prisma.vehicles.create({
                data: {
                    name: v.name,
                    registration: v.registration,
                    make: v.make,
                    model: v.model,
                    year: v.year,
                    fuel_type: v.fuel_type,
                    fuel_tank: v.fuel_tank,
                    org_id: fleet_org.org_id,
                },
            });
        }
    }
    console.log(`Seeded ${fleet_vehicles.length} fleet vehicles for ${fleet_org.name}`);

    const temporaryDriverPassword = process.env.TEST_DRIVER_PASSWORD;

    if (!temporaryDriverPassword) {
        throw new Error("TEST_DRIVER_PASSWORD is not set");
    }

    const temporaryDriver = await prisma.users.upsert({
        where: { email: "testdriver@omnitech.com" },
        update: {
            password_hash: await bcrypt.hash(temporaryDriverPassword, 10),
            status: "ACTIVE",
            email_verified: true,
            consent_status: true,
        },
        create: {
            username: "testdriver",
            name: "Test",
            surname: "Driver",
            email: "testdriver@omnitech.com",
            password_hash: await bcrypt.hash(temporaryDriverPassword, 10),
            role: "USER",
            dob: new Date("1995-01-01T00:00:00.000Z"),
            phone_number: "0600000001",
            consent_status: true,
            status: "ACTIVE",
            email_verified: true,
        },
    });

    await prisma.organization_members.upsert({
        where: {
            user_id: temporaryDriver.user_id,
        },
        update: {
            org_id: fleet_org.org_id,
            role: "DRIVER",
        },
        create: {
            org_id: fleet_org.org_id,
            user_id: temporaryDriver.user_id,
            role: "DRIVER",
        },
    });

    let temporaryVehicle = await prisma.vehicles.findFirst({
        where: {
            registration: "TMP-DRV-001",
        },
    });

    if (!temporaryVehicle) {
        temporaryVehicle = await prisma.vehicles.create({
            data: {
                name: "Temporary Driver Vehicle",
                registration: "TMP-DRV-001",
                make: "Toyota",
                model: "Corolla",
                year: 2023,
                fuel_type: "PETROL",
                fuel_tank: 50,
                org_id: fleet_org.org_id,
            },
        });
    }

    await prisma.users_vehicles.upsert({
        where: {
            user_id_vehicle_id: {
                user_id: temporaryDriver.user_id,
                vehicle_id: temporaryVehicle.vehicle_id,
            },
        },
        update: {},
        create: {
            user_id: temporaryDriver.user_id,
            vehicle_id: temporaryVehicle.vehicle_id,
        },
    });

    const existingTemporaryTrips = await prisma.trips.count({
        where: {
            user_id: temporaryDriver.user_id,
        },
    });

    for (let tripNumber = existingTemporaryTrips; tripNumber < 2; tripNumber++) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + tripNumber + 1);

        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 2);

        await prisma.trips.create({
            data: {
                user_id: temporaryDriver.user_id,
                vehicle_id: temporaryVehicle.vehicle_id,
                created_by: myLoginUser.user_id,
                status: "SCHEDULED",
                title: `Temporary Driver Trip ${tripNumber + 1}`,
                description: "Temporary seeded fleet trip",
                scheduled_for: startDate,
                scheduled_end: endDate,
                planned_start_addr: "Omnitech Office",
                planned_start_lat: -26.1438,
                planned_start_lng: 27.8421,
                planned_end_addr: "Johannesburg",
                planned_dest_lat: -26.2041,
                planned_dest_lng: 28.0473,
                start_latitude: -26.1438,
                start_longitude: 27.8421,
                end_latitude: -26.2041,
                end_longitude: 28.0473,
                distance_km: 18,
                duration_minutes: 120,
                fuel_estimate: 3,
                data_source: "PHONE",
            },
        });
    }

    console.log(
        `Seeded temporary driver ${temporaryDriver.email} with vehicle ${temporaryVehicle.registration} and two trips`,
    );

    //Creating Vehicles, Trips, Scores, Events and readings
    const trips = [];
    for (const user of users) {
        const existingTripCount = await prisma.trips.count({
            where: { user_id: user.user_id }
        });

        if(existingTripCount > 0){
            continue;
        }

        let vehicle = null; 
        const userAssignment = await prisma.users_vehicles.findFirst({
            where: { user_id: user.user_id },
            include: { vehicles: true }
        });
        if(userAssignment){
            vehicle = userAssignment.vehicles;
        }
        if(!vehicle){
            vehicle = await prisma.vehicles.create({
                data:{
                    registration: faker.vehicle.vrm(),
                    make: faker.vehicle.manufacturer(),
                    model: faker.vehicle.model(),
                    year: faker.date.past({ years: 15 }).getFullYear(),
                    fuel_type: faker.helpers.arrayElement(['PETROL', 'DIESEL', 'ELECTRIC']),
                    fuel_tank: 50
                }
            });

            await prisma.users_vehicles.create({
                data: {
                    user_id: user.user_id,
                    vehicle_id: vehicle.vehicle_id
                }
            });
        }
        // let vehicle = await prisma.vehicles.findFirst({
        //     where: { user_id: user.user_id }
        // });

        // if(!vehicle){
        //     vehicle = await prisma.vehicles.create({
        //         data: {
        //             user_id: user.user_id,
        //             registration: faker.vehicle.vrm(), // license plates
        //             make: faker.vehicle.manufacturer(),
        //             model: faker.vehicle.model(),
        //             year: faker.date.past({ years: 15 }).getFullYear(),
        //             fuel_type: faker.helpers.arrayElement(['PETROL', 'DIESEL', 'ELECTRIC']),
        //         }
        //     });
        // }

        //1-2 trips per vehicle, only on the first seed for that user
        const numTrips = faker.number.int({ min: 1, max: 2 });
        for (let t = 0; t < numTrips; t++) {
            const startLoc = getSAloc();
            const endLoc = getSAloc();

            const trip = await prisma.trips.create({
                data: {
                    user_id: user.user_id,
                    vehicle_id: vehicle.vehicle_id,
                    start_latitude: startLoc.lat,
                    start_longitude: startLoc.lng,
                    end_latitude: endLoc.lat,
                    end_longitude: endLoc.lng,
                    distance_km: faker.number.float({ min: 5, max: 150, fractionDigits: 2 }),
                    duration_minutes: faker.number.int({ min: 10, max: 180 }),
                    fuel_estimate: faker.number.float({ min: 1, max: 15, fractionDigits: 2 }),
                    data_source: 'PHONE',
                    status: 'COMPLETED',

                    trip_scores: {
                        create: {
                            safety_score: faker.number.float({ min: 60, max: 100, fractionDigits: 2 }),
                            eco_score: faker.number.float({ min: 50, max: 100, fractionDigits: 2 }),
                            overall_score: faker.number.float({ min: 65, max: 100, fractionDigits: 2 })
                        }
                    },

                    trip_events: {
                        create: Array.from({ length: 5 }).map(() => {
                            const eventLoc = getTestLoc(); // Use the test location
                            return {
                                type: faker.helpers.arrayElement(['HARSH_BRAKE', 'HARSH_ACCELERATION']),
                                latitude: eventLoc.lat,
                                longitude: eventLoc.lng,
                                severity: faker.number.float({ min: 5, max: 10, fractionDigits: 2 }),
                                sensor_source: 'ACCELEROMETER',
                                recorded_at: faker.date.recent()
                            }
                        })
                    },

                    trip_readings: {
                        create: Array.from({ length: 3 }).map(() => {
                            const readLoc = getSAloc();
                            return {
                                recorded_at: faker.date.recent(),
                                data_source: 'PHONE',
                                latitude: readLoc.lat,
                                longitude: readLoc.lng,
                                speed_kmh: faker.number.float({ min: 0, max: 120, fractionDigits: 2 }),
                                accelerometer: faker.number.float({ min: -2, max: 2, fractionDigits: 4 }),
                                rpm: faker.number.int({ min: 1000, max: 5000 })
                            }
                        })
                    }
                }
            });
            trips.push(trip);
        }
    }
    console.log(`Seeding Vehicles, Trips, Scores, Events and readings`);

    const allTrips = await prisma.trips.findMany();

    //Creating alerts, notifications and location shares
    for (let i = 0; i < 5; i++) {
        const trip = faker.helpers.arrayElement(allTrips);
        const alertLoc = getSAloc();

        //creating alert
        const alert = await prisma.alerts.create({
            data: {
                trip_id: trip.trip_id,
                user_id: trip.user_id,
                alert_type: faker.helpers.arrayElement(['CRASH_LIKE', 'UNEXPECTED_STOP']),
                message: faker.lorem.sentence(),
                latitude: alertLoc.lat,
                longitude: alertLoc.lng,
                recorded_at: new Date()
            }
        });

        //If user has trusted contacts, notify and share loc
        const userContacts = contacts.filter(c => c.user_id === trip.user_id);
        if (userContacts.length > 0) {
            const contactToNotify = faker.helpers.arrayElement(userContacts);

            await prisma.alert_notifications.create({
                data: {
                    alert_id: alert.alert_id,
                    contact_id: contactToNotify.contact_id,
                    delivery_status: 'SENT'
                }
            });

            //Avoiding unique constraint errors on location shares
            try {
                await prisma.trip_location_shares.create({
                    data: {
                        trip_id: trip.trip_id,
                        owner_user_id: trip.user_id,
                        contact_id: contactToNotify.contact_id
                    }
                });
            } catch (e) {
                //ignore if share already exists for this trip/contact combo
            }
        }
    }
    console.log(`Seeded alerts, notifications and trip location shares`);

    console.log('Seeding Road Quality Events (Potholes)...')

    const potholeLocations = [
        { lat: -25.7482, lng: 28.2354, label: 'Burnett St & Festival St (Near UP Campus)' },
        { lat: -25.7461, lng: 28.2313, label: 'Francis Baard St & Grosvenor St' },
        { lat: -25.7510, lng: 28.2388, label: 'Park St & Jan Shoba St' },
        { lat: -25.7445, lng: 28.2335, label: 'Pretorius St & Hilda St' },
        { lat: -25.7430, lng: 28.2370, label: 'Arcadia St & Richard St' },
        { lat: -25.7525, lng: 28.2410, label: 'South St & End St (Hatfield Gautrain)' },
        { lat: -25.7558, lng: 28.2295, label: 'Lynnwood Rd & Roper St (UP Gate)' },
        { lat: -25.7502, lng: 28.2360, label: 'Prospect St & Festival St' }
    ];

    if(users.length >= 3 && allTrips.length > 0){
        for(const loc of potholeLocations){
            const reporters = users.slice(0, 3);

            for(let i= 0; i < reporters.length; i++){
                const user = reporters[i];
                const userTrip = allTrips.find(t => t.user_id === user.user_id) ?? allTrips[i%allTrips.length]; 
            
                await prisma.road_quality_events.create({
                    data: {
                        user_id: user.user_id,
                        trip_id: userTrip.trip_id,
                        latitude: loc.lat,
                        longitude: loc.lng,
                        intensity: faker.number.float({ min: 6.5, max: 9.8, fractionDigits: 2 }),
                        event_type: 'IMPACT',
                        created_at: new Date()
                    }
                });
            }
        }
        console.log(`Seeded ${potholeLocations.length} verified potholes around Hatfield`)
    }

    console.log('Seeding finished successfully');

}


main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });