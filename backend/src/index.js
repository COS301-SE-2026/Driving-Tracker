const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
require('dotenv').config()

const app = express()

//security middleware

//security headers added to responses
app.use(helmet())
//prevents browser from blocking api requests
app.use(cors())
//allows express to parse JSON request bodies
app.use(express.json())

// GET /health endpoint - verifies API is running
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Driving Tracker API is running'
    })
})

//endpoints:


const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log("Server running on port", PORT)
})


