const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow larger request bodies for images
app.use(express.static(path.join(__dirname, '..', 'public'))); // Serve the frontend files

const DB_PATH = path.join(__dirname, 'db.json');

// Helper function to read from the database file
const readDB = () => {
    if (!fs.existsSync(DB_PATH)) {
        return [];
    }
    const data = fs.readFileSync(DB_PATH);
    return JSON.parse(data);
};

// Helper function to write to the database file
const writeDB = (data) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

// API Routes

// GET all work orders
app.get('/api/work-orders', (req, res) => {
    const orders = readDB();
    res.json(orders);
});

// POST a new work order
app.post('/api/work-orders', (req, res) => {
    const orders = readDB();
    const newOrder = req.body;

    // Check for duplicates
    if (orders.some(order => order.woNumber === newOrder.woNumber)) {
        return res.status(409).json({ message: 'Duplicate WO Number!' }); // 409 Conflict
    }

    orders.push(newOrder);
    writeDB(orders);
    res.status(201).json(newOrder);
});

// PUT (update) an existing work order
app.put('/api/work-orders/:woNumber', (req, res) => {
    let orders = readDB();
    const woNumberToUpdate = req.params.woNumber;
    const updatedOrderData = req.body;

    const orderIndex = orders.findIndex(order => order.woNumber === woNumberToUpdate);

    if (orderIndex === -1) {
        return res.status(404).json({ message: 'Work Order not found.' });
    }

    orders[orderIndex] = updatedOrderData;
    writeDB(orders);
    res.json(updatedOrderData);
});

// DELETE a work order
app.delete('/api/work-orders/:woNumber', (req, res) => {
    let orders = readDB();
    const woNumberToDelete = req.params.woNumber;

    const newOrders = orders.filter(order => order.woNumber !== woNumberToDelete);

    if (orders.length === newOrders.length) {
        return res.status(404).json({ message: 'Work Order not found.' });
    }

    writeDB(newOrders);
    res.status(204).send(); // 204 No Content
});

// Catch-all route to serve the main HTML file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'Trialv5.html'));
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});