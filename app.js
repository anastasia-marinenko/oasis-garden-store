require('dotenv').config();

const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const MONGO_URI = process.env.MONGO_URI;
const SESSION_SECRET = process.env.SESSION_SECRET;

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to MongoDB");
}).catch(err => {
    console.error("Error connecting to MongoDB:", err);
});

app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: MONGO_URI,
        collectionName: 'sessions',
        ttl: 60 * 60 * 24 // Session storage time (1 day)
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // Cookie is stored for 1 day
    }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const productsFile = path.resolve(__dirname, './data/products.json');

// Receiving a list of products
const getProducts = async () => {
    try {
        return await Product.find({});
    } catch (err) {
        console.error('Error reading products from database:', err);
        return [];
    }
};

// Home page (Product list)
app.get('/', async (req, res) => {
    try {
        const products = await getProducts();
        res.render('index', { products });
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).send('Server error while fetching products.');
    }
});

// Product details
app.get('/product/:name', async (req, res) => {
    try {
        const products = await getProducts();
        const product = products.find(p => p.name === req.params.name);

        if (product) {
            res.render('product', { product });
        } else {
            res.status(404).send('Product not found');
        }
    } catch (err) {
        console.error('Error fetching product details:', err);
        res.status(500).send('Server error while fetching product details.');
    }
});

// Registration of an order
app.get('/order/:product', async (req, res) => {
    try {
        const products = await getProducts();
        const product = products.find(p => p.name === req.params.product);

        if (product) {
            res.render('order', { product });
        } else {
            res.status(404).send('Product not found');
        }
    } catch (err) {
        console.error('Error fetching product for order:', err);
        res.status(500).send('Server error while fetching product for order.');
    }
});

// Thank you page
app.get('/thank-you', (req, res) => {
    res.render('thank-you');
});

// API for placing an order
app.post('/api/order', (req, res) => {
    const { productName, quantity } = req.body;
    const products = getProducts();
    const product = products.find(p => p.name === productName);

    if (!product) {
        return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    if (product.quantity < quantity) {
        return res.status(400).json({ success: false, message: 'Not enough products in the warehouse.' });
    }

    product.quantity -= quantity;

    try {
        fs.writeFileSync(productsFile, JSON.stringify(products, null, 2));
    } catch (err) {
        console.error("Error writing to file:", err);
        return res.status(500).json({ success: false, message: 'Error updating the warehouse.' });
    }

    res.json({ success: true, message: 'The order has been placed successfully.' });
});

// Setting up a session
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

// Route to add a product to the basket
app.post('/cart/add', async (req, res) => {
    const { productName, productQuantity, productPrice } = req.body;
    const quantity = parseInt(productQuantity, 10);

    if (!productName || isNaN(quantity) || quantity <= 0) {
        return res.status(400).send('Incorrect data to add to cart.');
    }

    try {
        const products = await getProducts();
        const product = products.find(p => p.name === productName);

        if (!product) {
            return res.status(404).send('Item not found.');
        }

        if (quantity > product.quantity) {
            return res.status(400).send('Not enough goods in the warehouse.');
        }

        // Initialize cart in session if it doesn't exist
        if (!req.session.cart) {
            req.session.cart = [];
        }

        // Check if product already exists in cart
        const existingProductIndex = req.session.cart.findIndex(item => item.productName === productName);

        if (existingProductIndex !== -1) {
            req.session.cart[existingProductIndex].productQuantity += quantity;
        } else {
            req.session.cart.push({ productName, productQuantity: quantity, productPrice });
        }

        res.redirect('/cart');
    } catch (err) {
        console.error('Error adding product to cart:', err);
        res.status(500).send('Server error while adding product to cart.');
    }
});

// Cart page
app.get('/cart', (req, res) => {
    try {
        const cart = req.session.cart || []; // If the basket does not exist, initialise it as an empty array
        res.render('cart', { cart });
    } catch (err) {
        console.error('Error fetching cart:', err);
        res.status(500).send('Server error while fetching cart.');
    }
});

const productSchema = new mongoose.Schema({
    name: String,
    quantity: Number,
    price: Number,
    description: String
});

const Product = mongoose.model('Product', productSchema);

// Function for loading products from a file into the database
const loadProductsFromFile = async () => {
    try {
        const fileData = fs.readFileSync('./data/products.json', 'utf-8');
        const products = JSON.parse(fileData);

        const existingProducts = await Product.countDocuments();
        if (existingProducts === 0) {
            await Product.insertMany(products);
            console.log('Products loaded into the database');
        }
    } catch (err) {
        console.error('Error loading products from file:', err);
    }
};

// Call this function when the server starts
loadProductsFromFile();

// Instead of writing to a file, we update the data in MongoDB after the session ends or on the first request (after purchasing the product)
app.post('/order/confirm', async (req, res) => {
    const cart = req.session.cart || [];
    if (cart.length === 0) {
        return res.status(400).send('The basket is empty or damaged.');
    }

    try {
        for (const item of cart) {
            const product = await Product.findOne({ name: item.productName });
            if (!product) {
                return res.status(400).send(`Product "${item.productName}" is not in stock.`);
            }

            if (product.quantity < item.productQuantity) {
                return res.status(400).send(`The product "${item.productName}" is out of stock.`);
            }

            product.quantity -= item.productQuantity;
            await product.save(); // Update the product in the database
        }

        req.session.cart = [];
        res.render('orderConfirmation', { cart });
    } catch (err) {
        console.error('Error updating warehouse data:', err);
        return res.status(500).send('Error updating warehouse data.');
    }
});

let wishlist = [];

// Add a product to the wish list
app.post("/wishlist/add", (req, res) => {
    const { productName, productPrice } = req.body;

    // Initialise the wishlist in the session if it doesn't already exist
    if (!req.session.wishlist) {
        req.session.wishlist = [];
    }

    // Check if the product is already in the wishlist
    const existingItem = req.session.wishlist.find(item => item.name === productName && item.price === productPrice);

    if (!existingItem) {
        // Add the product to the wish list
        req.session.wishlist.push({ name: productName, price: productPrice });
    }

    res.redirect("/wishlist");
});

// Removing an item from the wish list
app.post("/wishlist/remove", (req, res) => {
    const { productName } = req.body;

    if (req.session.wishlist) {
        // Remove the product from the wish list
        req.session.wishlist = req.session.wishlist.filter(item => item.name !== productName && item.price !== productPrice);
    }

    res.redirect("/wishlist");
});

// Displaying the wish list
app.get("/wishlist", (req, res) => {
    try {
        const wishlist = req.session.wishlist || []; // If the list does not exist, initialise it as empty
        res.render("wishlist", { wishlist });
    } catch (err) {
        console.error('Error fetching wishlist:', err);
        res.status(500).send('Server error while fetching wishlist.');
    }
});

app.post('/cart/remove', (req, res) => {
    const { productName, productPrice } = req.body;

    if (req.session.cart) {
        req.session.cart = req.session.cart.filter(item =>
            item.productName !== productName || item.productPrice != parseFloat(productPrice)
        );
    }

    res.redirect('/cart');
});

// Uncomment if you are running the site on a local server
//app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`)); 

// Comment if you are running the site on a local server
module.exports = app;