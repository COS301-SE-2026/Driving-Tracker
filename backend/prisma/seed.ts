//import { PrismaClient } from '@prisma/client';
import prisma from '../src/db/prisma';

//const prisma = new PrismaClient();

async function main() {

    console.log('Start seeding....');

    //Creating a user
    const user = await prisma.users.upsert({
        where: { email: 'james@gmail.com' },
        update: {},
        create: {
            username: 'himothy',
            name: 'James',
            surname: 'James',
            email: 'james@gmail.com',
            password_hash: 'hashed_password_example', //we might use bcrypt or argon2
            role: 'USER',
            consent_status: true,
            status: 'ACTIVE',
        },
    });
    console.log(`Created user with id: ${user.user_id}`);

    //Creating a vehicle for the user
    const vehicle = await prisma.vehicles.create({
        data: {
            user_id: user.user_id,
            registration: 'ABC-1234',
            make: 'Toyota',
            model: 'Corola',
            year: 2020,
            fuel_type: 'PETROL',
        },
    });
    console.log(`Created vehicle with id: ${vehicle.vehicle_id}`);

    //Creating badges
    const safeDriverBadge = await prisma.badges.upsert({
        where: { name: 'Safe Driver' },
        update: {},
        create: {
            name: 'Safe Driver',
            description: 'Completed 10 trips with a score above 90',
            category: 'MILESTONE',
        },
    });
    console.log(`Created badge: ${safeDriverBadge.name}`);

    //Creating a trip
    const trip = await prisma.trips.create({
        data: {
            user_id: user.user_id,
            vehicle_id: vehicle.vehicle_id,
            start_latitude: -33.8688,
            start_longitude: 151.2093,
            data_source: 'PHONE_SENSORS',
            status: 'COMPLETED',
            distance_km: 15.4,
            duration_minutes: 32,
            
            //nested write for trip scores
            trip_scores: {
                create: {
                    safety_score: 95.0,
                    eco_score: 88.0,
                    overall_score: 92.0
                }
            }
        },
    });
    console.log(`Created trip with trip id: ${trip.trip_id}`);

    console.log(`Seeding finished.`);

}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });