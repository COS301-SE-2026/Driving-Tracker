//load tests for the readings end points 
import http from 'k6/http';
import { check, group, sleep } from 'k6';

const BASE_URL = __ENV.API_URL || 'http://api-nfr:3000';

export const options = {
    stages:[
        {duration: '30s', target: 50},// 50 active drivers 
        { duration: '2m', target: 200 }, // Commute spike (200 concurrent drivers)
        { duration: '30s', target: 0 },
    ],
    thresholds:{
        'http_req_duration{name:PostReadings}': ['p(95)<150', 'p(99)<400'], // Latency SLA
        'http_req_failed': ['rate<0.01'],
    }
};
export default function(){
    const payload = JSON.stringify({
        latitude: -26.2041 + Math.random() * 0.01,
        longitude: 28.0473 + Math.random() * 0.01,
        speed: 60 + Math.random() * 20,
        timestamp: new Date().toISOString(),
    });
    const res = http.post(`${BASE_URL}/api/trips/${__ENV.TRIP_ID}/readings`, payload, {
        headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${__ENV.TOKEN}` 
        },
        tags: { name: 'PostReadings' },
    });
    check(res, { 'status is 200/201': (r) => r.status === 200 || r.status === 201 });
}