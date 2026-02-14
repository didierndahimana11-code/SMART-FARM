// =============================================
// USER MANAGEMENT ROUTES
// =============================================

import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await req.db.get(
            'SELECT id, name, email, phone, user_type, farm_name, farm_location, crops_grown, bio, profile_image, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);

    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Update user profile
router.put('/profile', authenticateToken, [
    body('name').optional().trim().notEmpty(),
    body('phone').optional().isMobilePhone(),
    body('farm_name').optional().trim(),
    body('farm_location').optional().trim(),
    body('crops_grown').optional().trim(),
    body('bio').optional().trim()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name, phone, farm_name, farm_location, crops_grown, bio } = req.body;

        await req.db.run(
            `UPDATE users SET 
             name = COALESCE(?, name),
             phone = COALESCE(?, phone),
             farm_name = COALESCE(?, farm_name),
             farm_location = COALESCE(?, farm_location),
             crops_grown = COALESCE(?, crops_grown),
             bio = COALESCE(?, bio),
             updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [name, phone, farm_name, farm_location, crops_grown, bio, req.user.id]
        );

        res.json({ message: 'Profile updated successfully' });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Get user statistics
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch various statistics
        const [loans, marketplace, orders, chatInteractions] = await Promise.all([
            req.db.all('SELECT status, COUNT(*) as count FROM loans WHERE user_id = ? GROUP BY status', [userId]),
            req.db.get('SELECT COUNT(*) as total FROM marketplace_products WHERE farmer_id = ?', [userId]),
            req.db.get('SELECT COUNT(*) as total FROM orders WHERE buyer_id = ?', [userId]),
            req.db.get('SELECT COUNT(*) as total FROM chatbot_interactions WHERE user_id = ?', [userId])
        ]);

        res.json({
            loans: loans || [],
            products_listed: marketplace?.total || 0,
            orders_made: orders?.total || 0,
            chat_interactions: chatInteractions?.total || 0
        });

    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Search users (for marketplace connections)
router.get('/search', async (req, res) => {
    try {
        const { type, location, crop } = req.query;

        let query = 'SELECT id, name, user_type, farm_location, crops_grown, bio FROM users WHERE user_type IN (?, ?)';
        const params = ['farmer', 'buyer'];

        if (type) {
            query = query.replace('user_type IN (?, ?)', 'user_type = ?');
            params.splice(0, 2, type);
        }

        if (location) {
            query += ' AND farm_location LIKE ?';
            params.push(`%${location}%`);
        }

        if (crop) {
            query += ' AND crops_grown LIKE ?';
            params.push(`%${crop}%`);
        }

        query += ' LIMIT 50';

        const users = await req.db.all(query, params);
        res.json({ users, count: users.length });

    } catch (error) {
        console.error('User search error:', error);
        res.status(500).json({ error: 'Failed to search users' });
    }
});

// Get user by ID (public info only)
router.get('/:userId/public', async (req, res) => {
    try {
        const user = await req.db.get(
            'SELECT id, name, user_type, farm_location, crops_grown, bio FROM users WHERE id = ?',
            [req.params.userId]
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);

    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

export default router;
