// =============================================
// MARKETPLACE ROUTES
// =============================================

import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from './auth.js';

const router = express.Router();

// List products (public)
router.get('/products', async (req, res) => {
    try {
        const { crop_type, min_price, max_price, location } = req.query;

        let query = `SELECT p.*, u.name as farmer_name, u.farm_location 
                     FROM marketplace_products p 
                     JOIN users u ON p.farmer_id = u.id 
                     WHERE p.status = 'available'`;
        const params = [];

        if (crop_type) {
            query += ' AND p.crop_type = ?';
            params.push(crop_type);
        }
        if (min_price) {
            query += ' AND p.price_per_unit >= ?';
            params.push(min_price);
        }
        if (max_price) {
            query += ' AND p.price_per_unit <= ?';
            params.push(max_price);
        }
        if (location) {
            query += ' AND p.location LIKE ?';
            params.push(`%${location}%`);
        }

        query += ' ORDER BY p.created_at DESC';

        const products = await req.db.all(query, params);
        res.json({ products, count: products.length });

    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get product details
router.get('/products/:productId', async (req, res) => {
    try {
        const product = await req.db.get(
            `SELECT p.*, u.name as farmer_name, u.phone, u.farm_location 
             FROM marketplace_products p 
             JOIN users u ON p.farmer_id = u.id 
             WHERE p.id = ?`,
            [req.params.productId]
        );

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);

    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// List farmer's products
router.get('/farmer/products', authenticateToken, async (req, res) => {
    try {
        const products = await req.db.all(
            `SELECT * FROM marketplace_products WHERE farmer_id = ? ORDER BY created_at DESC`,
            [req.user.id]
        );

        res.json({ products, count: products.length });

    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Create product listing
router.post('/products', authenticateToken, [
    body('product_name').trim().notEmpty().withMessage('Product name required'),
    body('crop_type').notEmpty().withMessage('Crop type required'),
    body('quantity').isFloat({ min: 0.1 }).withMessage('Valid quantity required'),
    body('unit').notEmpty().withMessage('Unit required'),
    body('price_per_unit').isFloat({ min: 0.01 }).withMessage('Valid price required'),
    body('location').notEmpty().withMessage('Location required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { product_name, crop_type, quantity, unit, price_per_unit, location, harvest_date, description } = req.body;

        const result = await req.db.run(
            `INSERT INTO marketplace_products 
             (farmer_id, product_name, crop_type, quantity, unit, price_per_unit, location, harvest_date, description)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, product_name, crop_type, quantity, unit, price_per_unit, location, harvest_date, description]
        );

        res.status(201).json({
            message: 'Product listed successfully',
            product_id: result.id,
            status: 'available'
        });

    } catch (error) {
        console.error('Product creation error:', error);
        res.status(500).json({ error: 'Failed to create product listing' });
    }
});

// Update product
router.put('/products/:productId', authenticateToken, async (req, res) => {
    try {
        const product = await req.db.get(
            'SELECT * FROM marketplace_products WHERE id = ?',
            [req.params.productId]
        );

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (product.farmer_id !== req.user.id && req.user.user_type !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { quantity, price_per_unit, status } = req.body;

        await req.db.run(
            `UPDATE marketplace_products SET quantity = ?, price_per_unit = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [quantity !== undefined ? quantity : product.quantity, 
             price_per_unit !== undefined ? price_per_unit : product.price_per_unit,
             status || product.status,
             req.params.productId]
        );

        res.json({ message: 'Product updated successfully' });

    } catch (error) {
        console.error('Product update error:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Delete product
router.delete('/products/:productId', authenticateToken, async (req, res) => {
    try {
        const product = await req.db.get(
            'SELECT * FROM marketplace_products WHERE id = ?',
            [req.params.productId]
        );

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (product.farmer_id !== req.user.id && req.user.user_type !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        await req.db.run('DELETE FROM marketplace_products WHERE id = ?', [req.params.productId]);
        res.json({ message: 'Product deleted successfully' });

    } catch (error) {
        console.error('Product deletion error:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// Create order
router.post('/orders', authenticateToken, [
    body('product_id').isInt().withMessage('Valid product ID required'),
    body('quantity').isFloat({ min: 0.1 }).withMessage('Valid quantity required'),
    body('delivery_address').notEmpty().withMessage('Delivery address required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { product_id, quantity, delivery_address } = req.body;

        const product = await req.db.get(
            'SELECT * FROM marketplace_products WHERE id = ?',
            [product_id]
        );

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (quantity > product.quantity) {
            return res.status(400).json({ error: 'Insufficient quantity available' });
        }

        const total_price = quantity * product.price_per_unit;

        const result = await req.db.run(
            `INSERT INTO orders (buyer_id, product_id, quantity, total_price, delivery_address)
             VALUES (?, ?, ?, ?, ?)`,
            [req.user.id, product_id, quantity, total_price, delivery_address]
        );

        res.status(201).json({
            message: 'Order created successfully',
            order_id: result.id,
            total_price: total_price.toFixed(2)
        });

    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Get user orders
router.get('/orders', authenticateToken, async (req, res) => {
    try {
        const orders = await req.db.all(
            `SELECT o.*, p.product_name, p.crop_type, u.name as farmer_name 
             FROM orders o 
             JOIN marketplace_products p ON o.product_id = p.id 
             JOIN users u ON p.farmer_id = u.id 
             WHERE o.buyer_id = ? ORDER BY o.created_at DESC`,
            [req.user.id]
        );

        res.json({ orders, count: orders.length });

    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

export default router;
