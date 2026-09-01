import http from 'k6/http';
import { check, group, sleep } from 'k6'; 

const BASE_URL =__ENV.API_URL || 'http://localhost:3000';
const TEST_USER_EMAIL = __ENV.TEST_USER_EMAIL || 'testuser@example.com';
const TEST_USER_PASSWORD = __ENV.TEST_USER_PASSWORD || 'TestPassword123!';
const TEST_VEHICLE_ID = __ENV.TEST_VEHICLE_ID || 'test-vehicle-uuid-1234';


interface setup_data {
    token: string;
    user_id: string;
}

interface AuthResponse {
    data?: {
        token?: string;
        user_id?: string;
        access_token?: string;
    };
    access_token?: string;
    user_id?: string;
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
  vus: 10, // concurrent users 
  duration: '30s',
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
    const login_payload = JSON.stringify({
        identifier: TEST_USER_EMAIL,
        passwordd: TEST_USER_PASSWORD
    });
    
    const login_res =http.post(`${BASE_URL}/auth/login`,login_payload,{
        headers:{'Content-Type':'application/json'},
    });

    check(login_res,{
        'login successfull': (r) => r.status === 200, 
    });

    const login_data = login_res.json() as AuthResponse;
    return{
        token: login_data.data?.token || login_data.access_token ||'',
        user_id: login_data.data?.user_id || login_data.user_id || '',
    };
}
export default function(data:setup_data): void{
    const {token, user_id} = data;
    const headers: Record<string,string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
    };
    group('Start trip performance', () =>{
        const start_trp_payload = JSON.stringify({
            vehicle_id: TEST_VEHICLE_ID,
            data_source: 'mixed',
            start_date: new Date().toISOString(),
            start_location: {
                lat: 40.7128,
                lng: -74.006,
            },
        });

        const start_trip_res = http.post(`${BASE_URL}/trips/start_trip`,start_trp_payload,{
            headers,
            tags: {name: 'Start_trip'}
        });

        check(start_trip_res,{
            'start trip status 200': (r) => r.status ==- 200,
            'start trip response time < 500ms': (r) => r.timings.duration < 500,
            'start trip has trip_id': (r) => {
                const data = r.json() as trip_start_response;
                return data.data?.trip_id !== undefined || data.trip_id !== undefined;
            },
        })


    })


}