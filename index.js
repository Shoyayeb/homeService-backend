const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
require("dotenv").config();

const admin = require('firebase-admin');
admin.initializeApp({
    credential: admin.credential.cert({
        "projectId": process.env.FIREBASE_PROJECT_ID,
        "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        "client_email": process.env.FIREBASE_CLIENT_EMAIL,
    })
});
const auth = admin.auth();

const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.4f4qc.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

async function run() {
    try {
        await client.connect();
        const database = client.db("homeService");
        const usersCollection = database.collection("users");
        const servicesCollection = database.collection("services");
        const bookedServiceCollection = database.collection("bookedService");
        const reviewCollections = database.collection("reviews");

        app.get("/allusers", async (req, res) => {
            auth.listUsers(100).then((userRecords) => {
                res.send(userRecords);
            }).catch((error) => {
                res.send({ error });
            });
        });

        app.get("/allusers/:id", async (req, res) => {
            const email = req.params.id;
            const query = { email: (email) };
            await usersCollection.findOne(query).then((user) => {
                if (user.role === 'admin') {
                    res.json({ isAdmin: true });
                } else {
                    res.json({ isAdmin: false });
                }
            }).catch((error) => {
                res.json({ error: error.message });
            })
        });

        app.get("/services", async (req, res) => {
            const cursor = servicesCollection.find({});
            const services = await cursor.toArray();
            res.send(services);
        });

        app.get("/service/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await servicesCollection.findOne(query);
            res.json(service);
        });

        app.get("/bookedservices", async (req, res) => {
            const cursor = bookedServiceCollection.find({});
            const bookedService = await cursor.toArray();
            res.send(bookedService);
        });

        app.get("/mybookedservices/:id", async (req, res) => {
            const id = req.params.id;
            const query = { uid: (id) };
            const cursor = await bookedServiceCollection.find(query);
            const services = await cursor.toArray();
            res.json(services);
        });

        app.get("/reviews", async (req, res) => {
            const cursor = reviewCollections.find({});
            const reviews = await cursor.toArray();
            res.send(reviews);
        })

        app.post("/addservice", async (req, res) => {
            const service = req.body;
            const result = await servicesCollection.insertOne(service);
            res.json(result);
        });

        app.post("/bookingservice", async (req, res) => {
            const service = req.body;
            const result = await bookedServiceCollection.insertOne(service);
            res.json(result);
        });

        app.post("/reviews", async (req, res) => {
            const review = req.body;
            const result = await reviewCollections.insertOne(review);
            res.json(result);
        });

        app.post("/adduser", async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result);
        });

        app.put('/adduser', async (req, res) => {
            const user = req.body;
            const filteredUsers = { email: user.email };
            const result = await usersCollection.updateOne(filteredUsers, { $set: user }, { upsert: true });
            res.json(result);
        });

        app.put('/adduser/admin', async (req, res) => {
            const admin = req.body;
            const filteredUsers = { email: admin.email }
            const updateDoc = { $set: { role: 'admin' } };
            const result = await usersCollection.updateOne(filteredUsers, updateDoc);
            res.json(result);
        });

        app.delete('/removeservice/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await bookedServiceCollection.deleteOne(query);
            res.json(result);
        });

        app.delete('/services/:removeId', async (req, res) => {
            const removeId = req.params.removeId;
            const query = { _id: ObjectId(removeId) };
            const result = await servicesCollection.deleteOne(query);
            res.json(result);
        });

        app.delete('/removeuser', async (req, res) => {
            const { uid } = req.body;
            if (req.body.uid) {
                auth.deleteUser(uid)
                    .then(() => {
                        res.json({ success: true });
                    })
                    .catch((error) => {
                        res.json({ success: false, error: error.message });
                        console.log('Error deleting user:', error);
                    });
            } else res.json({ success: false, error: "invalid uid" });
        });
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