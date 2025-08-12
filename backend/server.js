const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI; // We will set this in Render

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// MongoDB Connection
let db;
MongoClient.connect(MONGODB_URI)
    .then((client) => {
        db = client.db(); // Default database from connection string
        console.log('Successfully connected to MongoDB Atlas!');
    })
    .catch((err) => {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    });

// API Routes

// GET all work orders
app.get('/api/work-orders', (req, res) => {
    db.collection('workorders')
        .find()
        .toArray()
        .then((orders) => {
            res.status(200).json(orders);
        })
        .catch(() => res.status(500).json({ error: 'Could not fetch the documents' }));
});

// POST a new work order
app.post('/api/work-orders', async (req, res) => {
    const newOrder = req.body;

    // Check for duplicates
    const existing = await db.collection('workorders').findOne({ woNumber: newOrder.woNumber });
    if (existing) {
        return res.status(409).json({ message: 'Duplicate WO Number!' });
    }

    db.collection('workorders')
        .insertOne(newOrder)
        .then((result) => {
            res.status(201).json({ ...newOrder, _id: result.insertedId });
        })
        .catch(() => res.status(500).json({ error: 'Could not create a new document' }));
});

// PUT (update) an existing work order
app.put('/api/work-orders/:woNumber', (req, res) => {
    const updatedOrderData = req.body;
    delete updatedOrderData._id; // Remove the _id from the update payload to prevent errors

    db.collection('workorders')
        .updateOne({ woNumber: req.params.woNumber }, { $set: updatedOrderData })
        .then(result => {
            if (result.matchedCount === 0) {
                 return res.status(404).json({ error: 'Work order not found' });
            }
            res.status(200).json({ message: 'Work order updated' });
        })
        .catch(() => res.status(500).json({ error: 'Could not update the document' }));
});

// DELETE a work order
app.delete('/api/work-orders/:woNumber', (req, res) => {
    db.collection('workorders')
        .deleteOne({ woNumber: req.params.woNumber })
        .then(result => {
            if (result.deletedCount === 0) {
                return res.status(404).json({ error: 'Work order not found' });
            }
            res.status(200).json({ message: 'Work order deleted' });
        })
        .catch(() => res.status(500).json({ error: 'Could not delete the document' }));
});

// This now comes AFTER the API routes
app.use(express.static(path.join(__dirname, '..', 'public'))); 

// Catch-all route to serve the main HTML file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'Trialv5.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});