const express = require('express');
require('dotenv').config({path: `${process.cwd()}/.env`})
const cors = require('cors')
const authRouter = require("./route/authRoute");

const app = express();

app.use(express.json());
app.use(cors());


app.get('/' , (req, res) => {
    res.status(200).json({
        status: "success",
        message: "REST APIs are working",
    });
});

// all routes will be here

app.use('/api/v1/auth', authRouter)

// Error handler

app.use('*', (req, res, next) => {
    res.status(404).json({
        status: "fail",
        message: "Route not found"
    })
})

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`server is running on ${port}`);
})