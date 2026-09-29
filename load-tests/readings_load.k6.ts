//load tests for the readings end points 
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.API_URL || 'http://api-nfr:3000';

export const options = {
    setupTimeout: '5m',    // Gives setup() up to 5 minutes to seed 200 users & trips , 
    teardownTimeout: '5m',
    stages:[
        {duration: '60s', target: 50},// 50 active drivers 
        { duration: '2m', target: 200 }, // Commute spike (200 concurrent drivers)
        { duration: '30s', target: 0 },
    ],
    thresholds:{
        'http_req_duration{name:PostReadings}': ['p(95)<250', 'p(99)<400'], // Latency SLA
        'http_req_failed': ['rate<0.01'],
    }
};
interface TestDriver {
    token: string;
    tripId: string;
}
function getSecureCoordinateOffset():number{
    const array = new Uint8Array(1);
    crypto.getRandomValues(array);
    return (array[0] % 100) * 0.0001; 
}
function getSecureRandomInt(min: number, max: number): number { 
    const array = new Uint32Array(1); 
    crypto.getRandomValues(array); 
    return min + (array[0] % (max - min + 1));
}
function registerUser(runId: number, i: number) {
    const email = `loadtest_${runId}_${i}@omnitech.com`;
    const username = `user_${runId}_${i}`;
    const password = "MySecretPassword123!";
    const phoneNumber = `0${String(runId).slice(-6)}${String(i).padStart(3, '0')}`;

    //REGISTER
    const res = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify({
        email, username, password, name: "k6", surname: `driver${i}`,
        phone_number: phoneNumber, dob: "1995-01-01", consent_status: true
    }), { headers: { 'Content-Type': 'application/json' } });

    if (res.status >= 400) {
        console.log(`[Driver ${i}] Register Failed (${res.status}): ${res.body}`);
        return null;
    }
    return { email, password };
}
function loginUser(email: string, password: string, i: number){
    const res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({ identifier: email,password}),{
        headers:{'Content-Type':'application/json'}
    });
    const body = res.json() as any;
    const token = body?.token || body?.data?.token || '';
    if (!token) {
        console.log(`[Driver ${i}] Login Failed (${res.status}): ${res.body}`);
        return null;
    }
    return token;
}
function provisionVehicle(token: string, runId: number, i:number){
    const res = http.post(`${BASE_URL}/vehicle/assign_vehicle`, JSON.stringify({ name: `tel car ${i}`,
        registration:`TEL-${runId.toString().slice(-4)}-${i}`,make: "Toyota", model: "Corolla", year: 2022, 
        fuel_type: "Petrol", fuel_tank: 50}),{headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`} 
    });
    const body = res.json() as any;
    return body?.vehicle_id || body?.data?.vehicle_id || null;
    
}
function startTrip(token: string, vehicle_id: string, i: number){
    const res = http.post(`${BASE_URL}/trips/start_trip`, JSON.stringify({
        vehicle_id, data_source:'PHONE',start_date: new Date().toISOString(), start_location: { lat: -26.2041, lng: 28.0473 }, 
        fuel_level_start: 50.0
    }),{headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`} });

    const body = res.json() as any;
    return body?.data?.trip_id || body?.trip_id || null;
}
export function setup(){
    const drivers : TestDriver[] = [];
    const runId = Date.now();
    for(let i = 1 ; i <= 200 ; i++){
        const creds = registerUser(runId, i);
        if (!creds) continue;
        
        const token = loginUser(creds.email, creds.password, i);
        if (!token) continue;

        const vehicleId = provisionVehicle(token, runId, i);
        if (!vehicleId) continue;

        const tripId = startTrip(token, vehicleId, i);
        if (tripId) {
            drivers.push({ token, tripId });
        }
    }
    return {drivers}
}
export default function(data: {drivers: TestDriver[]}){
    if (!data?.drivers || data.drivers.length === 0) { sleep(1); return; }
    const driver = data.drivers[(__VU - 1) % data.drivers.length];

    const payload = JSON.stringify({
        recorded_at: new Date().toISOString(),
        data_source: "PHONE",
        location: {
            lat: -26.2041 + getSecureCoordinateOffset(),
            lng: 28.0473 + getSecureCoordinateOffset(),
        },
        speed_kmh: getSecureRandomInt(60,80),
        accelerometer: 0.1,
        gyroscope_x: 0.01,
        gyroscope_y: 0.02,
        gyroscope_z: 0.03,
        rpm: 2500,
        coolant_temp_c: 90,
        fuel_trim_percent: 1.5,
        throttle_position: 25.0,
        dtc_codes: []
    });
    const res = http.post(`${BASE_URL}/trips/${driver.tripId}/readings/record`, payload,{
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${driver.token}`
        },
        tags: {name: 'PostReadings' },
    });
    check(res, { 'status is 200/201': (r) => r.status === 200 || r.status === 201 });

    sleep(1);
}
export function teardown(data: { drivers: TestDriver[]}){
    if(!data.drivers || data.drivers.length === 0) return ;
    
    for (const driver of data.drivers) {
        if (!driver.token) continue;
        const res = http.post(`${BASE_URL}/users/me/delete`,
        JSON.stringify({ password: "MySecretPassword123!" }), {
            headers: {
                'Authorization': `Bearer ${driver.token}`,
            },
        });

        if (res.status === 200 || res.status === 204) {
            console.log(`User : ${driver} deleted`)
        } else {
            console.log(`[Teardown] Failed to delete user: status ${res.status}`);
        }
    }

}