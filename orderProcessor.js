const fs = require('fs');
const path = require('path');

const productsFilePath = path.join(__dirname, 'data', 'products.json');

/* Updating the quantity of goods after the customer's order.
 @param {Array} orders - Array of orders [{ name: 'Product name', quantity: quantity }, ...].  */
function updateProductStock(orders) {
    try {
        // Read the JSON file
        const data = fs.readFileSync(productsFilePath, 'utf-8');
        const products = JSON.parse(data);

        // Sorting out the order
        orders.forEach(order => {
            const product = products.find(p => p.name === order.name);

            if (product) {
                if (product.quantity >= order.quantity) {
                    product.quantity -= order.quantity;
                } else {
                    console.log(`Shortage of product: ${order.name}. Available: ${product.quantity}, ordered: ${order.quantity}`);
                }
            } else {
                console.log(`Item not found: ${order.name}`);
            }
        });

        // Overwrite the updated data in the JSON file
        fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2), 'utf-8');
        console.log('Stocks have been updated successfully.');

    } catch (error) {
        console.error('Error updating stocks:', error);
    }
}