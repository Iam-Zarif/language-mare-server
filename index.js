const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
var jwt = require("jsonwebtoken");
const stripe = require("stripe")(process.env.SECRET_PAYMENT_KEY);
const port = process.env.PORT || 5000;

// middleware

app.use(cors());
app.use(express.json());

const verifyJWT = (req,res,next) =>{
  const authorization = req.headers.authorization;
  if(!authorization) {
    return res.status(401).send({
      error :true, message:"unauthorized Access "
    })
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET , (err,decoded) =>{
    if(err){
      return res.status(401).send({
        error: true,
        message: "unauthorized Access ",
      });
    }
    req.decoded = decoded;
    next();
  })
}

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ik2qndc.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    const usersCollection = client.db("Mare").collection("users");
    const classesCollection = client.db("Mare").collection("popular-classes");


    app.post("/jwt" , (req,res) =>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "10h",
      });
      res.send({token})
    })
    app.get("/users", verifyJWT, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.get("/classes", async (req, res) => {
      const result = await classesCollection.find().toArray();
      res.send(result);
    });

// 
// 
// 

app.get("/instructor", async (req, res) => {
  try {
    const instructor = await usersCollection
      .find({ role: "instructor" })
      .toArray();
    res.json(instructor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 
// 

app.get("/approvedClasses", async (req, res) => {
  try {
    const instructor = await classesCollection
      .find({ status: "approve" })
      .toArray();
    res.json(instructor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 
// 

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
// 
// 


// 






    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(filter,updateDoc);
      res.send(result)
    });
    app.patch("/users/instructor/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "instructor",
        },
      };
      const result = await usersCollection.updateOne(filter,updateDoc);
      res.send(result)
    });
    app.post("/users", async (req, res) => {
      const user = req.body;
      if(!user.email){
        res.send([])
      }

      
      // const decodedEmail = req.decoded.email;
      // if(email !== decodedEmail){
      //   return res.status(403).send({error:true , message:"Forbidden Access"})
      // }
      console.log(user);
      const query = { email: user.email };
      const existUser = await usersCollection.findOne(query);
      console.log("Existing user", existUser);
      if (existUser) {
        return res.send({ message: "User already exist" });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
   



    // 
    // 
    app.put("/all/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };

      const classes = req.body;
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: classes.status,
        },
      };
      const result = await classesCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });


// 
  //  

app.get("/user/admin/:email", verifyJWT, async (req, res) => {
  const email = req.params.email;
  if (req.decoded.email !== email) {
    res.send({ admin: false });
  }
  const query = { email: email };
  const user = await usersCollection.findOne(query);
  const result =   user?.role === "admin" ;

  res.send(result);
});
app.get("/user/instructor/:email", verifyJWT, async (req, res) => {
  const email = req.params.email;
  if (req.decoded.email !== email) {
    res.send({ instructor: false });
  }
  const query = { email: email };
  const user = await usersCollection.findOne(query);
  const result = user?.role === "instructor"; ;

  res.send(result);
});

// 
// 



app.post("/classes" , async(req,res) =>{
  const classes = req.body;
const user = await classesCollection.insertOne(classes);
res.send(user);
})

app.get("/myClasses",verifyJWT, async (req, res) => {
  // const email = req.query.email;
  // const query = { email: email };
  const result = await classesCollection.find().toArray();
  res.send(result);
});

    app.post("/create-payment-intend", async (req, res) => {
      const { price } = req.body;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Mare is talking");
});

app.listen(port, () => {
  console.log(`Mare is talking on port ${port}`);
});
