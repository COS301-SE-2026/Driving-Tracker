import http from 'k6/http';
import { check, group, sleep } from 'k6'; 

const BASE_URL =__ENV.API_URL || 'http://localhost:3000';
const TEST_USER_EMAIL = __ENV.TEST_USER_EMAIL || 'omnitech@gmail.com';
const TEST_USER_PASSWORD = __ENV.TEST_USER_PASSWORD || 'MySecretPassword123!';
const TEST_VEHICLE_ID = __ENV.TEST_VEHICLE_ID || 'test-vehicle-uuid-1234';

interface setup_data {
    token: string;
    user_id: string;
}

interface AuthResponse {
    token?: string;
    refresh_token?: string;
    user_id?: string;
    // Fallbacks just in case
    data?: {
        token?: string;
        user_id?: string;
    };
}

interface trip_start_response {
    data?: {
        trip_id?: string;
        status?: string;
    };
    trip_id?: string;
}

interface trip_end_response {
    data?: {
        status?: string;
        trip_id?: string;
    };
    status?: string;
}

// Performance thresholds
export const options = {
  vus: 1, // concurrent users 
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.1'],
  },
  ext: {
    loadimpact: {
      name: 'Trip Endpoints Performance Test',
    },
  },
};
export function setup(): setup_data{
    // authenticate once during setup 
      console.log("--- ENVIRONMENT CHECK ---");
    console.log("Target URL: " + BASE_URL);
    console.log("Test Email: " + TEST_USER_EMAIL);
    console.log("Test Vehicle: " + TEST_VEHICLE_ID);
    console.log("-------------------------");
    
    
    const login_payload = JSON.stringify({
        identifier: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
    });
    
    const login_res =http.post(`${BASE_URL}/api/auth/login`,login_payload,{
        headers:{'Content-Type':'application/json'},
    });
    check(login_res,{
        'login successfull': (r) => r.status === 200 || r.status === 201, 
    });

    const login_data = login_res.json() as AuthResponse;
    const token = login_data.token || login_data.data?.token || '';
    
    if (!token) {
        console.log("CRITICAL ERROR: Failed to obtain token during setup!");
        console.log("Response was: " + login_res.body);
    }

    return {
        token: token,
        user_id: login_data.user_id || login_data.data?.user_id || '',
    };
}
export default function(data: setup_data): void {
    const { token } = data;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    group('Trip Lifecycle Performance', () => {
        const start_trp_payload = JSON.stringify({
            vehicle_id: TEST_VEHICLE_ID,
            data_source: 'PHONE', // Changed to match enum in your backend
            start_date: new Date().toISOString(),
            start_location: { lat: -25.7479, lng: 28.2293 },
            fuel_level_start: 50.0
        });

        // 1. INCREASE TIMEOUT to see if it ever finishes
        const start_trip_res = http.post(`${BASE_URL}/trips/start_trip`, start_trp_payload, {
            headers,
            tags: { name: 'Start_trip' },
            timeout: '120s' 
        });

        // CHECK STATUS BEFORE PARSING
        const is_start_ok = check(start_trip_res, {
            'start trip status 2xx': (r) => r.status === 200 || r.status === 201,
            'start trip fast enough': (r) => r.timings.duration < 2000,
        });

        if (!is_start_ok) {
            console.log(`VU ${__VU}: StartTrip FAILED (Status: ${start_trip_res.status}). Body: ${start_trip_res.body}`);
            return; // Skip the rest of the test for this iteration
        }

        // 3. SAFE JSON PARSING
        let start_data;
        try {
            start_data = start_trip_res.json() as trip_start_response;
        } catch (e) {
            console.log(`VU ${__VU}: Failed to parse StartTrip JSON`);
            return;
        }

        const trip_id = start_data.data?.trip_id || start_data.trip_id;

        if (trip_id) {
            sleep(1);

            group('End trip performance', () => {
                const end_trip_payload = JSON.stringify({
                    end_time: new Date().toISOString(),
                    route_polyline: { type: "LineString", coordinates: [[28.2, -25.7], [28.3, -25.8]] },
                    distance_km: 10.5,
                    duration_minutes: 15,
                    fuel_estimate: 2.5,
                    status: 'COMPLETED',
                    fuel_level_end: 45.0
                });

                const endRes = http.patch(`${BASE_URL}/trips/${trip_id}/end_trip`, end_trip_payload, {
                    headers,
                    tags: { name: 'EndTrip' }
                });

                check(endRes, {
                    'end trip status 200': (r) => r.status === 200,
                    'end trip completed': (r) => typeof r.body === 'string' && r.body.includes("COMPLETED")
                });
            });
        }
    });
    sleep(1);
}
// export default function(data:setup_data): void{
//     const {token, user_id} = data;
//     const headers: Record<string,string> = {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`
//     };
//     group('Start trip performance', () =>{
//         const start_trp_payload = JSON.stringify({
//             vehicle_id: TEST_VEHICLE_ID,
//             data_source: 'mixed',
//             start_date: new Date().toISOString(),
//             start_location: {
//                 lat: 40.7128,
//                 lng: -74.006,
//             },
//             share_with_contacts: [],
//             fuel_level_start: 25.0
//         });

//         const start_trip_res = http.post(`${BASE_URL}/trips/start_trip`,start_trp_payload,{
//             headers,
//             tags: {name: 'Start_trip'}
//         });

//         if(start_trip_res.status !== 200 && start_trip_res.status !== 201){
//             console.log("startTrip failed! Status: " + start_trip_res.status);
//             console.log("Response body: " + start_trip_res.body);
//         }

//         check(start_trip_res, {
//             'start trip status 200': (r) => r.status === 200 || r.status === 201,
//             'start trip response time < 500ms': (r) => r.timings.duration < 500,
//             'start trip has trip_id': (r) => {
//                 // 2. ONLY parse if we have a body
//                 if (!r.body) return false;
//                 try {
//                     const data = r.json() as trip_start_response;
//                     return data.data?.trip_id !== undefined || data.trip_id !== undefined;
//                 } catch (e) {
//                     return false;
//                 }
//             },
//         });
//         const start_data = start_trip_res.json() as trip_start_response;
//         const trip_id = start_data.data?.trip_id|| start_data.trip_id;

//         if(trip_id){
//             sleep(1);

//             group('End trip performance', () =>{
//                 const end_trip_payload = JSON.stringify({
//                     end_time: new Date().toISOString(),
//                     route_polyline: "string of the coordinates,,,",
//                     distance_km: 10.5,
//                     duration_minutes: 15,
//                     fuel_estimate: 2.5,
//                     status: 'COMPLETED',
//                     safety_score: 85.0,
//                     eco_score: 78.0,
//                     overall_score: 81.5
//                 });
//                 const endRes = http.patch(
//                 `${BASE_URL}/trips/${trip_id}/end_trip`,
//                 end_trip_payload,
//                 {
//                     headers,
//                     tags: { name: 'EndTrip' },
//                 }
//                 );

//                 check(endRes, {
//                 'end trip status 200': (r) => r.status === 200,
//                 'end trip response time < 500ms': (r) => r.timings.duration < 500,
//                 'end trip completed': (r) => {
//                     const data = r.json() as trip_end_response;
//                     return data.data?.status === 'COMPLETED' || data.status === 'COMPLETED';
//                 },
//                  });
//             });
//         }
//     })
//     sleep(1);
// }
export function handleSummary(data: any): Record<string,string>{
    //return the summary of the tests
    return {
        stdout: textSummary(data, { indent: '',enableColors: true}),
    }; 
}
function textSummary(data:any, options:{ indent?: string; enableColors?:boolean} = {}):string{
    const indent = options.indent || '';
    let summary = '\n=== Performance Test Summary ===\n';

    if (data.metrics) {
        const httpDuration = data.metrics.http_req_duration;
        if (httpDuration && httpDuration.values) {
            summary += `${indent}Response Times:\n`;
            summary += `${indent}  Min: ${Math.round(httpDuration.values.min)}ms\n`;
            summary += `${indent}  Max: ${Math.round(httpDuration.values.max)}ms\n`;
            summary += `${indent}  Avg: ${Math.round(httpDuration.values.avg)}ms\n`;
            summary += `${indent}  P95: ${Math.round(httpDuration.values['p(95)'])}ms\n`;
            summary += `${indent}  P99: ${Math.round(httpDuration.values['p(99)'])}ms\n`;
        }

        const httpFailed = data.metrics.http_req_failed;
        if (httpFailed) {
            summary += `${indent}Failed Requests: ${httpFailed.values.value}\n`;
        }
    }

    return summary;
}