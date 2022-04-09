const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
// const stripe = require('stripe')(process.env.STRIPE_SECRET);
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
        const bookedServiceCollection = database.collection("bookedService");

        // get api for getting users
        app.get("/allusers", async (req, res) => {
            const cursor = usersCollection.find({});
            const users = await cursor.toArray();
            res.send(users);
        });
        // get api for getting single user
        app.get("/allusers/:id", async (req, res) => {
            const email = req.params.id;
            console.log(email)
            const query = { email: (email) };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            let gotUser = {};
            if (user?.role === 'admin') {
                isAdmin = true,
                    gotUser = user;
            }
            res.json({ admin: isAdmin });
        });
        // get api for getting all services
        app.get("/services", async (req, res) => {
            const cursor = servicesCollection.find({});
            const services = await cursor.toArray();
            res.send(services);
        });
        // get api for getting single service
        app.get("/service/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await servicesCollection.findOne(query);
            res.json(service);
        });
        // get api for getting booked services
        app.get("/bookedservices", async (req, res) => {
            const cursor = bookedServiceCollection.find({});
            const bookedService = await cursor.toArray();
            res.send(bookedService);
        });
        // get api -for orders on dashboard
        app.get("/mybookedservices/:id", async (req, res) => {
            const id = req.params.id;
            const query = { uid: (id) };
            const cursor = await bookedServiceCollection.find(query);
            const services = await cursor.toArray();
            res.json(services);
        });
        // post api for adding services
        app.post("/addservice", async (req, res) => {
            const service = req.body;
            const result = await servicesCollection.insertOne(service);
            res.json(result);
        });
        // post api for booking a service
        app.post("/bookingservice", async (req, res) => {
            const service = req.body;
            const result = await bookedServiceCollection.insertOne(service);
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
            res.json(result);
        });
        // put api for adding admin with email and password
        app.put('/adduser/admin', async (req, res) => {
            const admin = req.body;
            const filteredUsers = { email: admin.email }
            // const options = { upsert: true };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await usersCollection.updateOne(filteredUsers, updateDoc);
            res.json(result);
        });
        // delete api for removing booked service
        app.delete('/removeservice/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await bookedServiceCollection.deleteOne(query);
            res.json(result);
        })
        // delete api for removing service
        app.delete('/services/:removeId', async (req, res) => {
            const removeId = req.params.removeId;
            const query = { _id: ObjectId(removeId) };
            const result = await servicesCollection.deleteOne(query);
            res.json(result);
        })

        // stripe
        // app.post('/create_payment', async (req, res) => {
        //     const paymentInfo = req.body;
        //     const amount = paymentInfo.price * 100;
        //     const paymentIntent = await stripe.paymentIntents.create({
        //         currency: 'usd',
        //         amount: amount,
        //         payment_method_types: ['card']
        //     });
        //     res.json({ clientSecret: paymentIntent.client_secret })
        // })
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