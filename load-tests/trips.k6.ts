import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { getScenario } from './load-scenarios.ts';

const BASE_URL = __ENV.API_URL || 'http://api-nfr:3000';
const SCENARIO = __ENV.SCENARIO || 'smoke';
const config = getScenario(SCENARIO);

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
        // Measure duration ONLY on tagged core trip endpoints
        'http_req_duration{name:StartTrip}': ['p(95)<500'],
        'http_req_duration{name:EndTrip}': ['p(95)<500'],
        'http_req_failed': ['rate<0.1'],
    },
};

function safeJson(res: any) {
    try {
        return res.json();
    } catch (e) {
        return null;
    }
}

export function setup(): AuthedUser[] {
    const authed: AuthedUser[] = [];
    const vusNeeded = config.vus;
    const runId = Date.now();

    for (let i = 1; i <= vusNeeded; i++) {
        const email = `loadtest_${runId}_${i}@omnitech.com`;
        const username = `user_${runId}_${i}`;
        const password = "MySecretPassword123!";
        const phoneNumber = `0${Math.floor(100000000 + Math.random() * 900000000)}`;

        //REGISTER
        const regRes = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify({
            email, username, password, name: "Load", surname: "Test",
            phone_number: phoneNumber, dob: "1995-01-01", consent_status: true
        }), { headers: { 'Content-Type': 'application/json' } });

        if (regRes.status >= 400) {
            console.log(`[User ${i}] Register Failed (${regRes.status}): ${regRes.body}`);
            continue;
        }

        //LOGIN
        const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
            identifier: email, password
        }), { headers: { 'Content-Type': 'application/json' } });

        const loginBody = safeJson(loginRes);
        const token = loginBody?.token || loginBody?.data?.token || loginBody?.accessToken || '';

        if (!token) {
            console.log(`[User ${i}] Login Failed (${loginRes.status}): ${loginRes.body}`);
            continue;
        }

        const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

        //ASSIGN VEHICLE (Added required 'name' field)
        const assignRes = http.post(`${BASE_URL}/vehicle/assign_vehicle`, JSON.stringify({
            name: `Test Car ${i}`,
            registration: `K6-${runId.toString().slice(-4)}-${i}`,
            make: "Toyota",
            model: "Corolla",
            year: 2017,
            fuel_type: "Petrol",
            fuel_tank: 50,
            fuel_efficiency: 50
        }), { headers: authHeaders });

        console.log(`[User ${i}] ASSIGN RES (${assignRes.status}): ${assignRes.body}`);

        const assignBody = safeJson(assignRes);
        let vehicleId = assignBody?.vehicle_id || assignBody?.data?.vehicle_id || assignBody?.id || assignBody?.data?.id || '';

        //FETCH ALL VEHICLES IF NOT IN ASSIGN RESPONSE
        const vRes = http.get(`${BASE_URL}/vehicle/get_all_vehicles`, { headers: authHeaders });
        console.log(`[User ${i}] GET VEHICLES RES (${vRes.status}): ${vRes.body}`);

        if (!vehicleId) {
            const vBody = safeJson(vRes);
            const vehicleList = Array.isArray(vBody) ? vBody : (vBody?.data || vBody?.vehicles || []);
            if (Array.isArray(vehicleList) && vehicleList.length > 0) {
                vehicleId = vehicleList[0]?.vehicle_id || vehicleList[0]?.id || '';
            }
        }

        console.log(`[User ${i}] Resolved Vehicle ID: '${vehicleId}'`);

        if (token && vehicleId) {
            authed.push({ email, token, vehicle_id: vehicleId });
        }
    }

    if (authed.length === 0) {
        throw new Error("No users with valid vehicles were provisioned. Review the ASSIGN RES and GET VEHICLES logs above.");
    }

    return authed;
}

export default function (data: AuthedUser[]): void {
    const me = data[(__VU - 1) % data.length];

    if (!me || !me.token) {
        sleep(1);
        return;
    }

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
        }), { headers, tags: {name:'StartTrip'} });

        if (start_res.status < 200 || start_res.status >= 300) {
            console.log(`[Start Trip Failed - Status ${start_res.status}]: ${start_res.body}`);
        }

        const startPassed = check(start_res, { 'start trip 2xx': (r) => r.status === 200 || r.status === 201 });

        if (startPassed) {
            const body = safeJson(start_res);
            const trip_id = body?.data?.trip_id || body?.trip_id;

            if (trip_id) {
                sleep(2);

                const end_res = http.patch(`${BASE_URL}/trips/${trip_id}/end_trip`, JSON.stringify({
                    end_time: new Date().toISOString(),
                    status: 'COMPLETED',
                    distance_km: 1.0, 
                    duration_minutes: 1, 
                    fuel_estimate: 0.1, 
                    fuel_level_end: 49.0,
                    route_polyline: { type: "LineString", coordinates: [[28.2, -25.7], [28.3, -25.8]] }
                }), { headers, tags:{name:'EndTrip'} });

                check(end_res, { 'end trip 200': (r) => r.status === 200 });
            }
        }
    });

    sleep(2);
}