// src/services/databaseApi.js

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Replace placeholders in query with actual context values
 * Placeholders use the format: {{param_name}}
 * @param {string} query - SQL query with placeholders
 * @param {Object} context - Object with parameter values
 * @returns {string} Query with placeholders replaced
 */
const replaceQueryParams = (query, context = {}) => {
  if (!query) {
    return query;
  }
  
  if (!context || Object.keys(context).length === 0) {
    return query;
  }
  
  let processedQuery = query;
  
  // Replace all {{param_name}} placeholders with actual values
  Object.entries(context).forEach(([key, value]) => {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    // Escape single quotes in values to prevent SQL injection
    const safeValue = String(value).replace(/'/g, "''");
    processedQuery = processedQuery.replace(placeholder, safeValue);
  });
  
  // Warn if there are still unreplaced placeholders (helps debug)
  const unreplacedMatch = processedQuery.match(/\{\{[\w.]+\}\}/g);
  if (unreplacedMatch) {
    console.warn('Unreplaced query placeholders:', unreplacedMatch);
  }
  
  return processedQuery;
};

/**
 * Fetch options for a select_database dropdown
 * @param {string} query - SQL query (e.g., "SELECT id, name FROM users WHERE company_id = {{company_id}}")
 * @param {string} valueField - Column to use as option value
 * @param {string} labelField - Column to use as option label
 * @param {string} previewField - Column to use for preview URL (optional)
 * @param {Object} context - Context parameters to substitute in query (optional)
 * @returns {Promise<Array>} Array of { value, label, preview } options
 */
export const fetchSelectOptions = async (query, valueField, labelField, previewField = null, context = {}) => {
  try {
    // Replace placeholders with context values
    const processedQuery = replaceQueryParams(query, context);
    
    const response = await fetch(`${API_BASE_URL}/api/select-options`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: processedQuery,
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
 * Fetch options for grouped select (optgroups) - multiple queries
 * @param {Array} groups - Array of group definitions
 * @param {Object} context - Context parameters to substitute in queries (optional)
 * @returns {Promise<Array>} Array of { label, options } groups
 */
export const fetchGroupedSelectOptions = async (groups, context = {}) => {
  try {
    const results = await Promise.all(
      groups.map(async (group) => {
        try {
          const options = await fetchSelectOptions(
            group.query,
            group.valueField,
            group.labelField,
            group.previewField || null,
            context
          );
          return {
            label: group.label,
            options: options,
          };
        } catch (error) {
          console.error(`Failed to fetch group "${group.label}":`, error);
          return {
            label: group.label,
            options: [],
            error: error.message,
          };
        }
      })
    );
    return results;
  } catch (error) {
    console.error('fetchGroupedSelectOptions error:', error);
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
