
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.d5x0yu5.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.get('/', (req, res) => {
    res.send('Hello World')

})

async function run() {
    try {
        // await client.connect();
        const db = client.db('AttendenceCalculator');
        const studentCollection = db.collection('all_students');


        app.post('/allData', async (req, res) => {
            const newData = req.body;
            const email = newData.email;

            try {
                const existing = await studentCollection.findOne({ email });

                if (existing) {
                    return res.status(400).send({ message: "Attendance record already exists for this email." });
                }

                const result = await studentCollection.insertOne(newData);
                res.status(201).send({ message: "Attendance record created successfully.", data: result });
            } catch (err) {
                console.error(err);
                res.status(500).send({ message: "Server error." });
            }
        });


        app.get('/allData', async (req, res) => {
            const email = req.query.email;
            const query = {};
            if (email) {
                query.email = email;
            }

            const result = await studentCollection.find(query).toArray();
            res.send(result)
        })


        app.patch('/updateData', async (req, res) => {
            const updateData = req.body;
            const userEmail = updateData.email;

            if (!userEmail) {
                return res.status(400).send({ message: "Email is required for updating the record." });
            }
            const filter = { email: userEmail };
            const updateDoc = {
                $set: {
                    subjects: updateData.subjects
                },
            };

            const options = { upsert: false }; 

            const result = await studentCollection.updateOne(filter, updateDoc, options);

            if (result.matchedCount === 0) {
                return res.status(404).send({
                    acknowledged: false,
                    message: `No record found for email: ${userEmail}.`
                });
            }

            res.send(result);
        });

      
        app.delete('/allData/:id', async (req, res) => {
            const { id } = req.params;

            if (!ObjectId.isValid(id)) {
                return res.status(400).send({ message: "Invalid ID format." });
            }

            try {
                const result = await studentCollection.deleteOne({ _id: new ObjectId(id) });
                if (result.deletedCount === 0) return res.status(404).send({ message: "Record not found." });
                res.send({ message: "Record deleted successfully." });
            } catch (err) {
                console.error("Delete error:", err);
                res.status(500).send({ message: "Server error while deleting." });
            }
        });



        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        
    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);

})