const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

const authRoutes = require("./src/routes/v1/auth.routes");

app.use(express.json());
app.use(cors());

// Mount Routes
app.use("/api/v1/auth", authRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "success",
        data: {
            name: "Sequential",
            version: "1.0.0",
            author: "Your Name",
            year: new Date().getFullYear(),
        },
    });
});

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`)
})


