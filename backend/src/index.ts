import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';
import contacts_router from "./routes/contacts.route";

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

//tell Express to hand requests starting with /contacts to contacts_router
//contacts_router's "/" becomes "/contacts"
app.use("/contacts", contacts_router);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port", PORT)
});


