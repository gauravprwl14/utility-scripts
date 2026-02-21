// API Client with automatic token refresh
// Purpose: Centralized HTTP client with token management

const axios = require('axios');

class ApiClient {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.token = config.token;
    this.maxRetries = 1;
  }

  /**
   * Make API request with automatic token refresh on auth errors
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint path
   * @param {Object} data - Request body data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Response data
   */
  async request(method, endpoint, data = null, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this._buildHeaders(options.headers || {});

    try {
      const response = await axios({
        method,
        url,
        headers,
        data,
        withCredentials: true,
        validateStatus: (status) => status < 500, // Don't throw on 4xx
      });

      // Check for auth errors
      if (this._isAuthError(response)) {
        // Try to refresh token and retry once
        if (!options._isRetry) {
          console.log('🔄 Token expired, refreshing...');
          await this.refreshToken();
          // Retry with new token
          return this.request(method, endpoint, data, { ...options, _isRetry: true });
        } else {
          throw new Error(`Authentication failed after refresh: ${response.data?.message || 'Unauthorized'}`);
        }
      }

      return response.data;
    } catch (error) {
      if (error.response) {
        console.error('❌ API Error Details:');
        console.error('  Status:', error.response.status);
        console.error('  URL:', url);
        console.error('  Response:', JSON.stringify(error.response.data, null, 2));
        throw new Error(`API call failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`API call failed: ${error.message}`);
    }
  }

  /**
   * Build request headers with current token
   * @param {Object} additionalHeaders - Additional headers to merge
   * @returns {Object} Complete headers object
   */
  _buildHeaders(additionalHeaders = {}) {
    return {
      'accept': '*/*',
      'accept-language': 'en-GB,en;q=0.7',
      'content-type': 'application/json',
      'origin': this.baseUrl,
      'user-agent': 'Mozilla/5.0 (Linux; Intel Linux) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
      'cookie': `tldw_guest_token=${this.token}`,
      ...additionalHeaders,
    };
  }

  /**
   * Check if response indicates auth error
   * @param {Object} response - Axios response
   * @returns {boolean} True if auth error
   */
  _isAuthError(response) {
    if (response.status === 401 || response.status === 403) {
      return true;
    }
    
    const data = response.data;
    if (data && typeof data === 'object') {
      if (data.error === 'Unauthorized' || data.requiresAuth === true) {
        return true;
      }
      if (data.message && typeof data.message === 'string') {
        const msg = data.message.toLowerCase();
        if (msg.includes('token') || msg.includes('expired') || msg.includes('unauthorized')) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Refresh token by calling check-limit endpoint
   * @returns {Promise<string>} New token
   */
  async refreshToken() {
    try {
      const response = await axios({
        method: 'GET',
        url: `${this.baseUrl}/api/check-limit`,
        headers: {
          'accept': '*/*',
          'accept-language': 'en-GB,en;q=0.6',
          'cookie': `tldw_guest_token=${this.token}`,
        },
        withCredentials: true,
        validateStatus: () => true, // Don't throw on any status
      });

      // Extract new token from Set-Cookie header
      const setCookie = response.headers['set-cookie'];
      if (setCookie && Array.isArray(setCookie)) {
        for (const cookie of setCookie) {
          const match = cookie.match(/tldw_guest_token=([^;]+)/);
          if (match) {
            const newToken = match[1];
            console.log(`✅ Token refreshed: ${newToken.substring(0, 8)}...`);
            this.token = newToken;
            return newToken;
          }
        }
      }

      throw new Error('No token found in response cookies');
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Update token manually
   * @param {string} newToken - New token value
   */
  updateToken(newToken) {
    this.token = newToken;
  }

  /**
   * Get current token
   * @returns {string} Current token
   */
  getToken() {
    return this.token;
  }
}

module.exports = { ApiClient };
