const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(express.json())
app.use(cors())
app.get("/", (req, res) => {
    res.json({
        message: "success",
        data: {
            name: "Sequential",
            version: "1.0.0",
            author: "Your Name",
            year: new Date().getFullYear(),
        },
    })
})

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`)
})


