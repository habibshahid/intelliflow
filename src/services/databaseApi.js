// src/services/databaseApi.js

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Fetch options for a select_database dropdown
 * @param {string} query - SQL query (e.g., "SELECT id, name FROM users")
 * @param {string} valueField - Column to use as option value
 * @param {string} labelField - Column to use as option label
 * @param {string} previewField - Column to use for preview URL (optional)
 * @returns {Promise<Array>} Array of { value, label, preview } options
 */
export const fetchSelectOptions = async (query, valueField, labelField, previewField = null) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/select-options`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        valueField,
        labelField,
        previewField,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to fetch options');
    }

    return result.options;
  } catch (error) {
    console.error('fetchSelectOptions error:', error);
    throw error;
  }
};

/**
 * Test if backend is available
 * @returns {Promise<boolean>}
 */
export const checkBackendHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
};

/**
 * Test database connection
 * @returns {Promise<Object>}
 */
export const testDatabaseConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/test-db`);
    return await response.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
};
