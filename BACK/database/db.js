// =============================================
// DATABASE INITIALIZATION & MANAGEMENT
// =============================================

import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class Database {
    constructor() {
        const dbDir = __dirname;
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
        
        this.dbPath = path.join(dbDir, 'smartfarm.db');
        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error('Database connection error:', err);
            } else {
                console.log('✓ Database connected');
            }
        });
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                // Users table
                this.db.run(`
                    CREATE TABLE IF NOT EXISTS users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        email TEXT UNIQUE NOT NULL,
                        password TEXT NOT NULL,
                        phone TEXT,
                        user_type TEXT NOT NULL CHECK(user_type IN ('farmer', 'buyer', 'admin')),
                        farm_name TEXT,
                        farm_location TEXT,
                        crops_grown TEXT,
                        profile_image TEXT,
                        bio TEXT,
                        is_verified BOOLEAN DEFAULT 0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `, (err) => {
                    if (err) console.error('Users table error:', err);
                });

                // Loans table
                this.db.run(`
                    CREATE TABLE IF NOT EXISTS loans (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        amount REAL NOT NULL,
                        interest_rate REAL NOT NULL DEFAULT 8.5,
                        duration_months INTEGER NOT NULL,
                        loan_type TEXT NOT NULL,
                        purpose TEXT,
                        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'active', 'completed', 'defaulted')),
                        crop_season TEXT,
                        expected_harvest_date DATE,
                        collateral_value REAL,
                        monthly_payment REAL,
                        total_payment REAL,
                        amount_paid REAL DEFAULT 0,
                        approved_by INTEGER,
                        approved_date DATETIME,
                        rejection_reason TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                        FOREIGN KEY (approved_by) REFERENCES users(id)
                    )
                `, (err) => {
                    if (err) console.error('Loans table error:', err);
                });

                // Loan Payments table
                this.db.run(`
                    CREATE TABLE IF NOT EXISTS loan_payments (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        loan_id INTEGER NOT NULL,
                        amount REAL NOT NULL,
                        payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                        payment_method TEXT,
                        transaction_id TEXT UNIQUE,
                        status TEXT DEFAULT 'completed' CHECK(status IN ('pending', 'completed', 'failed')),
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
                    )
                `, (err) => {
                    if (err) console.error('Loan payments table error:', err);
                });

                // Marketplace Products table
                this.db.run(`
                    CREATE TABLE IF NOT EXISTS marketplace_products (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        farmer_id INTEGER NOT NULL,
                        product_name TEXT NOT NULL,
                        description TEXT,
                        crop_type TEXT NOT NULL,
                        quantity REAL NOT NULL,
                        unit TEXT NOT NULL (kg, tons, bundles, etc),
                        price_per_unit REAL NOT NULL,
                        harvest_date DATE,
                        location TEXT,
                        image_url TEXT,
                        status TEXT DEFAULT 'available' CHECK(status IN ('available', 'sold', 'expired')),
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE
                    )
                `, (err) => {
                    if (err) console.error('Marketplace products table error:', err);
                });

                // Orders table
                this.db.run(`
                    CREATE TABLE IF NOT EXISTS orders (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        buyer_id INTEGER NOT NULL,
                        product_id INTEGER NOT NULL,
                        quantity REAL NOT NULL,
                        total_price REAL NOT NULL,
                        delivery_address TEXT,
                        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
                        payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'failed')),
                        estimated_delivery DATE,
                        actual_delivery DATE,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
                        FOREIGN KEY (product_id) REFERENCES marketplace_products(id) ON DELETE CASCADE
                    )
                `, (err) => {
                    if (err) console.error('Orders table error:', err);
                });

                // AI Chatbot interactions table
                this.db.run(`
                    CREATE TABLE IF NOT EXISTS chatbot_interactions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        question TEXT NOT NULL,
                        answer TEXT,
                        category TEXT,
                        helpful INTEGER,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                    )
                `, (err) => {
                    if (err) console.error('Chatbot interactions table error:', err);
                });

                console.log('✓ All database tables initialized successfully');
                resolve();
            });
        });
    }

    // Execute query with promise
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    // Get single row
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Get all rows
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    // Close database
    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('✓ Database closed');
                    resolve();
                }
            });
        });
    }
}

export default Database;
