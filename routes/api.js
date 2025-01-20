const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/products.json');

const getProducts = () => {
    return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
};

const saveProducts = (products) => {
    fs.writeFileSync(dataPath, JSON.stringify(products, null, 2));
};

// GET all products
router.get('/products', (req, res) => {
    const products = getProducts();
    res.json(products);
});

// POST to order a product
router.post('/order', (req, res) => {
    const { product, quantity } = req.body;

    if (!product || !quantity || quantity <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid product or quantity.' });
    }

    const products = getProducts();
    const item = products.find(p => p.name === product);

    if (item && item.quantity >= quantity) {
        item.quantity -= quantity;
        saveProducts(products);
        res.json({ success: true, message: `Ordered ${quantity} of ${product}` });
    } else {
        res.json({ success: false, message: `Not enough stock for ${product}` });
    }
});

module.exports = router;