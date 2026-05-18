import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import auth_router from "./routes/auth.routes";
//import 'dotenv/config';
import contacts_router from "./routes/contacts.route";
import trip_router from "./routes/trips.routes";
import badges_leaderBoard_router from './routes/badges_leaderbord.routes';

const app = express();

//security middleware

//security headers added to responses
app.use(helmet());
//prevents browser from blocking api requests
app.use(cors());
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port", PORT)
});


