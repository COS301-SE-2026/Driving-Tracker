import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import auth_router from "./routes/auth.routes";
import 'dotenv/config';
import contacts_router from "./routes/contacts.route";
import trip_router from "./routes/trips.routes";
import badges_leaderBoard_router from './routes/badges_leaderbord.routes';
import leaderboard_router from './routes/leaderboard.routes';
import vehicle_router from './routes/vehicle.routes';
import user_devices_router from './routes/user_devices.routes';
import map_router from './routes/maps.routes';
import notifications_router from './routes/notifications.routes';

const app = express();

//security middleware

//trust proxy for rate limiting support
app.set('trust proxy', 1);

//security headers added to responses
app.use(helmet());
//prevents browser from blocking api requests
app.use(cors({origin: process.env.FRONTEND_URL || 'http://localhost:3000',
	credentials: true
}));
//allows express to parse JSON request bodies
app.use(express.json());

// GET /health endpoint - verifies API is running
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Driving Tracker API is running'
    });
});

app.use("/api/auth", auth_router);

//tell Express to hand requests starting with /contacts to contacts_router
//contacts_router's "/" becomes "/contacts"
app.use("/contacts", contacts_router);
app.use("/trips", trip_router);
app.use("/badges",badges_leaderBoard_router);
app.use('/leaderboard', leaderboard_router);
app.use('/vehicle',vehicle_router);
app.use('/devices', user_devices_router);
app.use('/map', map_router);
app.use('/notifications', notifications_router);

export default app;