// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// DATABASE CONFIGURATION - EDIT THIS SECTION
// ============================================
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'intelliflow',
  connectTimeout: 10000,
};

// Connection pool for better performance
let pool = null;

async function getPool() {
  if (!pool) {
    pool = mysql.createPool(DB_CONFIG);
    console.log('✅ Database pool created');
  }
  return pool;
}

// ============================================
// API ENDPOINTS
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Fetch select options - SIMPLE ENDPOINT
app.post('/api/select-options', async (req, res) => {
  try {
    const { query, valueField, labelField, previewField } = req.body;

    // Validation
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    if (!valueField || !labelField) {
      return res.status(400).json({
        success: false,
        error: 'valueField and labelField are required'
      });
    }

    // Security: Only allow SELECT queries
    const trimmedQuery = query.trim().toUpperCase();
    if (!trimmedQuery.startsWith('SELECT')) {
      return res.status(403).json({
        success: false,
        error: 'Only SELECT queries are allowed'
      });
    }

    // Execute query
    const dbPool = await getPool();
    const [rows] = await dbPool.execute(query);

    // Map to options format
    const options = rows.map(row => ({
      value: row[valueField],
      label: row[labelField],
      preview: previewField ? row[previewField] : null,
      raw: row
    }));

    res.json({
      success: true,
      options,
      count: options.length
    });

  } catch (error) {
    console.error('Query error:', error);
    
    // User-friendly error messages
    let errorMessage = 'Database query failed';
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      errorMessage = 'Database access denied';
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      errorMessage = 'Database not found';
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Cannot connect to database';
    } else if (error.code === 'ER_PARSE_ERROR') {
      errorMessage = 'Invalid SQL query';
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      errorMessage = 'Table not found';
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      errorMessage = 'Column not found in table';
    }

    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const dbPool = await getPool();
    await dbPool.query('SELECT 1');
    
    res.json({
      success: true,
      message: 'Database connected',
      config: {
        host: DB_CONFIG.host,
        port: DB_CONFIG.port,
        database: DB_CONFIG.database
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║     IntelliFlow Backend Server                 ║
╠════════════════════════════════════════════════╣
║  🚀 Server:    http://localhost:${PORT}          ║
║  📊 Health:    http://localhost:${PORT}/health   ║
║  🔌 Test DB:   http://localhost:${PORT}/api/test-db ║
╠════════════════════════════════════════════════╣
║  Database: ${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}
╚════════════════════════════════════════════════╝
  `);
});

module.exports = app;
