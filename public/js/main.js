document.getElementById('orderForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const productName = document.getElementById('product').value;
    const quantity = parseInt(document.getElementById('quantity').value, 10);

    if (!productName || isNaN(quantity) || quantity <= 0) {
        alert('Please select a valid product and quantity.');
        return;
    }

    try {
        const response = await fetch('/api/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product: productName, quantity }),
        });

        const result = await response.json();

        if (result.success) {
            alert(result.message);
        } else {
            alert(result.message);
        }
    } catch (error) {
        alert('Error processing your order. Please try again later.');
        console.error(error);
    }
});
