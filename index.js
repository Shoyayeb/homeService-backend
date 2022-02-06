const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;

require("dotenv").config();
const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4f4qc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

async function run() {
    try {
        await client.connect();
        const database = client.db("homeService");
        const usersCollection = database.collection("users");

        app.post("/adduser", async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result);
        });
        app.put('/adduser', async (req, res) => {
            const user = req.body;
            const filteredUsers = { email: user.email }
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filteredUsers, updateDoc, options);
        })
    } finally {
        // await client.close();
    }
}

run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("Server running");
});

app.listen(port, () => {
    console.log("Running server on", port);
});