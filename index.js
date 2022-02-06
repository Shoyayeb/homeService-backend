const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;

require("dotenv").config();
// using express and cors
const app = express();
app.use(cors());
app.use(express.json());
// using env to set port hidden from others
const port = process.env.PORT || 5000;

// dynamic url for mongodb with dotenv
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4f4qc.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
// mongodb config
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

async function run() {
    try {
        // code for connect to mongodb 
        await client.connect();
        const database = client.db("homeService");
        const usersCollection = database.collection("users");
        const servicesCollection = database.collection("services");

        // get api for getting users
        app.get("/allusers", async (req, res) => {
            const cursor = usersCollection.find({});
            const users = await cursor.toArray();
            res.send(users);
        });
        // get api for getting services
        app.get("/services", async (req, res) => {
            const cursor = servicesCollection.find({});
            const services = await cursor.toArray();
            res.send(services);
        });

        // post api for adding services
        app.post("/addservice", async (req, res) => {
            const service = req.body;
            const result = await servicesCollection.insertOne(service);
            res.json(result);
        });
        // post api for adding users with email and password
        app.post("/adduser", async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result);
        });
        // put api for adding user with third party service login
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