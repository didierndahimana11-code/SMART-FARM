// =============================================
// LOAN MANAGEMENT ROUTES
// =============================================

import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Helper function to calculate loan details
function calculateLoanPayment(principal, annualRate, months) {
    const monthlyRate = annualRate / 100 / 12;
    const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                          (Math.pow(1 + monthlyRate, months) - 1);
    const totalPayment = monthlyPayment * months;
    return { monthlyPayment, totalPayment };
}

// Apply for loan
router.post('/apply', authenticateToken, [
    body('amount').isFloat({ min: 1000 }).withMessage('Loan amount must be at least 1000'),
    body('duration_months').isInt({ min: 1, max: 120 }).withMessage('Duration must be 1-120 months'),
    body('loan_type').isIn(['seasonal', 'equipment', 'land', 'emergency']).withMessage('Invalid loan type'),
    body('crop_season').notEmpty().withMessage('Crop season is required'),
    body('expected_harvest_date').isISO8601().withMessage('Valid harvest date required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { amount, duration_months, loan_type, crop_season, expected_harvest_date, purpose, collateral_value } = req.body;
        const userId = req.user.id;

        // Get interest rate based on loan type
        const interestRates = {
            'seasonal': 7.5,
            'equipment': 8.5,
            'land': 6.5,
            'emergency': 9.5
        };

        const interestRate = interestRates[loan_type] || 8.5;
        const { monthlyPayment, totalPayment } = calculateLoanPayment(amount, interestRate, duration_months);

        // Create loan application
        const result = await req.db.run(
            `INSERT INTO loans (user_id, amount, interest_rate, duration_months, loan_type, status, crop_season, 
                expected_harvest_date, collateral_value, monthly_payment, total_payment, purpose)
             VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)`,
            [userId, amount, interestRate, duration_months, loan_type, crop_season, expected_harvest_date, collateral_value, monthlyPayment, totalPayment, purpose]
        );

        res.status(201).json({
            message: 'Loan application submitted successfully',
            loan_id: result.id,
            status: 'pending',
            monthlyPayment: monthlyPayment.toFixed(2),
            totalPayment: totalPayment.toFixed(2)
        });

    } catch (error) {
        console.error('Loan application error:', error);
        res.status(500).json({ error: 'Failed to submit loan application' });
    }
});

// Get user's loans
router.get('/my-loans', authenticateToken, async (req, res) => {
    try {
        const loans = await req.db.all(
            `SELECT * FROM loans WHERE user_id = ? ORDER BY created_at DESC`,
            [req.user.id]
        );

        res.json({ loans, count: loans.length });

    } catch (error) {
        console.error('Error fetching loans:', error);
        res.status(500).json({ error: 'Failed to fetch loans' });
    }
});

// Get loan details
router.get('/:loanId', authenticateToken, async (req, res) => {
    try {
        const loan = await req.db.get(
            `SELECT * FROM loans WHERE id = ?`,
            [req.params.loanId]
        );

        if (!loan) {
            return res.status(404).json({ error: 'Loan not found' });
        }

        // Check permissions
        if (loan.user_id !== req.user.id && req.user.user_type !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get payment history
        const payments = await req.db.all(
            `SELECT * FROM loan_payments WHERE loan_id = ? ORDER BY payment_date DESC`,
            [req.params.loanId]
        );

        res.json({ loan, payments });

    } catch (error) {
        console.error('Error fetching loan:', error);
        res.status(500).json({ error: 'Failed to fetch loan details' });
    }
});

// Get all loans (admin only)
router.get('/', authenticateToken, async (req, res) => {
    try {
        if (req.user.user_type !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const status = req.query.status;
        let query = 'SELECT l.*, u.name, u.email FROM loans l JOIN users u ON l.user_id = u.id';
        let params = [];

        if (status) {
            query += ' WHERE l.status = ?';
            params.push(status);
        }

        query += ' ORDER BY l.created_at DESC';

        const loans = await req.db.all(query, params);
        res.json({ loans, count: loans.length });

    } catch (error) {
        console.error('Error fetching loans:', error);
        res.status(500).json({ error: 'Failed to fetch loans' });
    }
});

// Approve loan (admin only)
router.post('/:loanId/approve', authenticateToken, async (req, res) => {
    try {
        if (req.user.user_type !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const loan = await req.db.get('SELECT * FROM loans WHERE id = ?', [req.params.loanId]);
        if (!loan) {
            return res.status(404).json({ error: 'Loan not found' });
        }

        await req.db.run(
            `UPDATE loans SET status = 'approved', approved_by = ?, approved_date = CURRENT_TIMESTAMP WHERE id = ?`,
            [req.user.id, req.params.loanId]
        );

        res.json({ message: 'Loan approved successfully', status: 'approved' });

    } catch (error) {
        console.error('Loan approval error:', error);
        res.status(500).json({ error: 'Failed to approve loan' });
    }
});

// Reject loan (admin only)
router.post('/:loanId/reject', authenticateToken, [
    body('reason').notEmpty().withMessage('Rejection reason is required')
], async (req, res) => {
    try {
        if (req.user.user_type !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const loan = await req.db.get('SELECT * FROM loans WHERE id = ?', [req.params.loanId]);
        if (!loan) {
            return res.status(404).json({ error: 'Loan not found' });
        }

        await req.db.run(
            `UPDATE loans SET status = 'rejected', rejection_reason = ?, approved_date = CURRENT_TIMESTAMP WHERE id = ?`,
            [req.body.reason, req.params.loanId]
        );

        res.json({ message: 'Loan rejected', status: 'rejected' });

    } catch (error) {
        console.error('Loan rejection error:', error);
        res.status(500).json({ error: 'Failed to reject loan' });
    }
});

// Record loan payment
router.post('/:loanId/payment', authenticateToken, [
    body('amount').isFloat({ min: 1 }).withMessage('Valid payment amount required'),
    body('payment_method').notEmpty().withMessage('Payment method required')
], async (req, res) => {
    try {
        const loan = await req.db.get('SELECT * FROM loans WHERE id = ?', [req.params.loanId]);
        if (!loan) {
            return res.status(404).json({ error: 'Loan not found' });
        }

        if (loan.user_id !== req.user.id && req.user.user_type !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { amount, payment_method } = req.body;

        const result = await req.db.run(
            `INSERT INTO loan_payments (loan_id, amount, payment_method)
             VALUES (?, ?, ?)`,
            [req.params.loanId, amount, payment_method]
        );

        // Update amount paid
        const newAmountPaid = (loan.amount_paid || 0) + amount;
        let newStatus = loan.status;
        if (newAmountPaid >= loan.total_payment) {
            newStatus = 'completed';
        }

        await req.db.run(
            `UPDATE loans SET amount_paid = ?, status = ? WHERE id = ?`,
            [newAmountPaid, newStatus, req.params.loanId]
        );

        res.json({
            message: 'Payment recorded successfully',
            payment_id: result.id,
            amount_paid: newAmountPaid,
            remaining: Math.max(0, loan.total_payment - newAmountPaid)
        });

    } catch (error) {
        console.error('Payment error:', error);
        res.status(500).json({ error: 'Failed to record payment' });
    }
});

export default router;
