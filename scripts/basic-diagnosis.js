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

async function basicCollectionCheck() {
  console.log('🔍 Basic collection check...\n');

  const query = `
    query {
      collections(first: 10) {
        edges {
          node {
            id
            title
            handle
          }
        }
      }
    }
  `;

  try {
    const response = await client.request(query);
    console.log('Raw response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

async function testProductURL() {
  console.log('\n🧪 Testing individual product...\n');

  const query = `
    query {
      products(first: 1) {
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
    
    if (response.data && response.data.products.edges.length > 0) {
      const product = response.data.products.edges[0].node;
      console.log(`Found product: ${product.title}`);
      console.log(`Handle: ${product.handle}`);
      console.log(`Status: ${product.status}`);
      console.log(`Test URL: https://burnroadceramics.com/products/${product.handle}`);
    }
  } catch (error) {
    console.error('❌ Error getting products:', error.message);
  }
}

async function main() {
  console.log('🚀 BASIC DIAGNOSIS');
  console.log('==================\n');
  
  await basicCollectionCheck();
  await testProductURL();
  
  console.log('\n🎯 MANUAL TESTS TO DO NOW:');
  console.log('=========================\n');
  console.log('1. Test these URLs in your browser:');
  console.log('   - https://burnroadceramics.com/collections/all');
  console.log('   - https://burnroadceramics.com/products/sage-green-morning-mug');
  console.log('\n2. In Shopify Admin:');
  console.log('   - Go to: Products → Collections');
  console.log('   - Do you see your collections listed?');
  console.log('   - Click on "Functional Pottery"');
  console.log('   - Is there a "View collection" button?');
  console.log('\n3. Check your theme:');
  console.log('   - Online Store → Themes');
  console.log('   - What theme are you using?');
  console.log('   - Try clicking "Customize" and look for collection settings');
}

main().catch(console.error);