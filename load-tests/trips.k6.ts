import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { getScenario } from './load-scenarios.js';

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';
const scenarioName = __ENV.SCENARIO || 'smoke';
const config = getScenario(scenarioName);

interface AuthedUser {
    email: string;
    token: string;
    vehicle_id: string;
}

export const options = {
    ...(config.rampUp ? {
        stages: [
            { duration: config.rampUp, target: config.vus },
            { duration: config.duration, target: config.vus },
            { duration: '10s', target: 0 }
        ]
    } : {
        vus: config.vus,
        duration: config.duration,
    }),
    thresholds: {
        http_req_duration: ['p(95)<500'],
        http_req_failed: ['rate<0.1'],
    },
};

export function setup(): AuthedUser[] {
    const authed: AuthedUser[] = [];
    const vusNeeded = config.vus;

    console.log(`--- DYNAMIC SETUP: Provisioning ${vusNeeded} users ---`);

    for (let i = 1; i <= vusNeeded; i++) {
        const email = `loadtest_${i}@omnitech.com`;
        const password = "MySecretPassword123!";

        // 1. REGISTER
        const regRes = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify({
            email, username: `user_${i}_${Date.now()}`, password, name: "Load", surname: "Test",
            phone_number: "0123456789", dob: "1995-01-01", consent_status: true
        }), { headers: { 'Content-Type': 'application/json' } });

        // 2. LOGIN
        const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
            identifier: email, password
        }), { headers: { 'Content-Type': 'application/json' } });

        if (loginRes.status !== 200 && loginRes.status !== 201) {
            console.log(`PROVISIONING ERROR [User ${i}]: Login failed with ${loginRes.status}. Body: ${loginRes.body}`);
            continue;
        }

        const loginBody = loginRes.json() as any;
        const token = loginBody.token || '';

        // 3. VEHICLE ASSIGNMENT
        const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
        const vRes = http.get(`${BASE_URL}/vehicle/get_all_vehicles`, { headers: authHeaders });
        
        let vehicleId = '';
        if (vRes.status === 200) {
            const vehicles = vRes.json() as any[];
            if (vehicles.length > 0) {
                vehicleId = vehicles[0].vehicle_id;
            } else {
                const assignRes = http.post(`${BASE_URL}/vehicle/assign_vehicle`, JSON.stringify({
                    make: "Test", model: "Dynamic", year: 2024, fuel_type: "PETROL", fuel_tank: 50
                }), { headers: authHeaders });
                vehicleId = (assignRes.json() as any).vehicle_id;
            }
        }

        authed.push({ email, token, vehicle_id: vehicleId });
    }

    console.log(`--- SETUP COMPLETE: ${authed.length}/${vusNeeded} users ready ---`);
    if (authed.length === 0) throw new Error("No users were successfully provisioned. Test aborted.");
    
    return authed;
}

export default function (data: AuthedUser[]): void {
    const me = data[(__VU - 1) % data.length];
    if (!me || !me.token) return;

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${me.token}`,
    };

    group('Trip Lifecycle', () => {
        const start_res = http.post(`${BASE_URL}/trips/start_trip`, JSON.stringify({
            vehicle_id: me.vehicle_id,
            data_source: 'PHONE',
            start_date: new Date().toISOString(),
            start_location: { lat: -25.7, lng: 28.2 },
            fuel_level_start: 50.0
        }), { headers });

        if (check(start_res, { 'start trip 2xx': (r) => r.status === 200 || r.status === 201 })) {
            const trip_id = (start_res.json() as any).data.trip_id;
            sleep(2);
            
            const end_res = http.patch(`${BASE_URL}/trips/${trip_id}/end_trip`, JSON.stringify({
                end_time: new Date().toISOString(),
                status: 'COMPLETED',
                distance_km: 1.0, duration_minutes: 1, fuel_estimate: 0.1, fuel_level_end: 49.0,
                route_polyline: { type: "LineString", coordinates: [[28.2, -25.7], [28.3, -25.8]] }
            }), { headers });

            check(end_res, { 'end trip 200': (r) => r.status === 200 });
        }
    });
    sleep(2);
}