//import { PrismaClient } from '@prisma/client';
import prisma from '../src/db/prisma';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt'

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

async function main() {

    console.log('Start seeding....');

    //Our constant user
    const plainTextPassword = 'password123';
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
            role: 'USER',
            dob: faker.date.birthdate({ min: 18, max: 75, mode: 'age' }),
            phone_number: `+27${faker.number.int({ min: 600000000, max: 899999999 })}`,
            consent_status: true,
            status: 'ACTIVE',
        }
    });

    console.log(`Seeded our login user: ${myLoginUser.email} (Password: ${plainTextPassword})`);

    //making sure our user has a vehicle
    let myVehicle = await prisma.vehicles.findFirst({
        where: { user_id: myLoginUser.user_id }
    });

    if (!myVehicle) {
        myVehicle = await prisma.vehicles.create({
            data: {
                user_id: myLoginUser.user_id,
                registration: 'DRIVER1',
                make: 'BMW',
                model: 'M3',
                year: 2024,
                fuel_type: 'PETROL',
            }
        });
        console.log(`Seeded vehicle for Omnitech`);
    }

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

    //Ensuring user has at least 3 trips
    const tripCount = await prisma.trips.count({
        where: { user_id: myLoginUser.user_id }
    });

    if (tripCount < 3) {
        const tripsNeeded = 3 - tripCount;
        for (let i = 0; i < tripsNeeded; i++) {
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
                    data_source: 'PHONE_SENSORS',
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
        console.log(`Seeded ${tripsNeeded} Trips for Omnitech`);
    } else {
        console.log(`Verified 3 + Trips exist for Login User`)
    }

    //Creating 10 users
    const users = [];
    for (let i = 0; i < 10; i++){
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const user = await prisma.users.create({
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
        users.push(user);
    }
    console.log(`Seeded 10 users`);

    //Creating 5 badges with criteria
    const badges = [];
    const badgeCategories = ['MILESTONE', 'STEAK', 'SOCIAL', 'VARIETY'];
    for (let i = 0; i < 5; i++){
        const badge = await prisma.badges.create({
            data: {
                name: `${faker.word.adjective()} Driver ${i}`,
                description: faker.lorem.sentence(),
                category: faker.helpers.arrayElement(badgeCategories),
                icon_url: faker.image.url(),
                badge_criteria: {
                    create: {
                        metric: 'safety_score',
                        operator: '>',
                        threshold: faker.number.float({ min: 80, max: 95, fractionDigits: 2 }),
                        target: faker.number.int({ min: 5, max: 50 })
                    }
                }
            }
        });
        badges.push(badge);
    }
    console.log(`Seeded 5 badges`);

    //Creating leaderboard entries & user badges
    for (const user of users) {
        //Giving each user 1-5 random badges
        const numBadges = faker.number.int({  min: 1, max: 5});
        const userBadges = faker.helpers.arrayElements(badges, numBadges);
        for (const b of userBadges){
            await prisma.user_badges.create({
                data: { user_id: user.user_id, badge_id: b.badge_id }
            });
        }

        //Add to Leaderboard
        await prisma.leaderboard.create({
            data: {
                user_id: user.user_id,
                category: faker.helpers.arrayElement(['SAFETY', 'ECO', 'OVERALL']),
                scope: faker.helpers.arrayElement(['WEEKLY', 'MONTHLY', 'ALL_TIME']),
                score: faker.number.float({ min: 50, max: 100, fractionDigits: 2 })
            }
        });

    }
    console.log(`Seeded Leaderboards and User badges`);

    //Creating trusted contacts (linking random users together)
    const contacts: any[] = [];
    const seenContactPairs = new Set<string>();
    while (contacts.length < 8) {
        //picking 2 diff users
        const owner = faker.helpers.arrayElement(users);
        let contactUser = faker.helpers.arrayElement(users);
        while (owner.user_id === contactUser.user_id) contactUser = faker.helpers.arrayElement(users);

        const pairKey = `${owner.user_id}:${contactUser.user_id}`;
        if (seenContactPairs.has(pairKey)) {
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

    //Creating Vehicles, Trips, Scores, Events and rreadings
    const trips = [];
    for (const user of users) {
        const vehicle = await prisma.vehicles.create({
            data: {
                user_id: user.user_id,
                registration: faker.vehicle.vrm(),//license plates
                make: faker.vehicle.manufacturer(),
                model: faker.vehicle.model(),
                year: faker.date.past({ years: 15 }).getFullYear(),
                fuel_type: faker.helpers.arrayElement(['PETROL', 'DIESEL', 'ELECTRIC']),
            }
        });

        //1-2 trips per vehicle
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
                        create: Array.from({ length: 2 }).map(() => {
                            const eventLoc = getSAloc();
                            return {
                                type: faker.helpers.arrayElement(['HARSH_BRAKE', 'HARSH_ACCELERATION', 'SHARP_CORNER']),
                                latitude: eventLoc.lat,
                                longitude: eventLoc.lng,
                                severity: faker.number.float({ min: 1, max: 10, fractionDigits: 2 }),
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

    //Creating alerts, notifications and location shares
    for (let i = 0; i < 5; i++) {
        const trip = faker.helpers.arrayElement(trips);
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