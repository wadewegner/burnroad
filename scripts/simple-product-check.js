const { createAdminApiClient } = require('@shopify/admin-api-client');

// Load configuration
let config;
try {
  config = require('./config.js');
} catch (error) {
  console.error('❌ Config file not found. Please copy config.example.js to config.js and fill in your credentials.');
  process.exit(1);
}

// Create Admin API client
const client = createAdminApiClient({
  storeDomain: config.shopifyStoreDomain,
  accessToken: config.shopifyAccessToken,
  apiVersion: config.shopifyApiVersion || '2024-10',
});

async function checkProducts() {
  console.log('🔍 Checking basic product info...\n');

  // Simple query to get products
  const query = `
    query {
      products(first: 10) {
        edges {
          node {
            id
            title
            handle
            status
          }
        }
      }
    }
  `;

  try {
    const response = await client.request(query);
    console.log('Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.graphQLErrors) {
      console.error('GraphQL errors:', JSON.stringify(error.graphQLErrors, null, 2));
    }
  }
}

checkProducts().catch(console.error);