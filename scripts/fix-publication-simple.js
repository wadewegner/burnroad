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

async function publishProductSimple(productId, productTitle) {
  console.log(`📤 Publishing "${productTitle}"...`);

  const mutation = `
    mutation productUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product {
          id
          title
          publishedAt
          status
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      id: productId,
      status: "ACTIVE",
      published: true
    }
  };

  try {
    const response = await client.request(mutation, { variables });
    
    if (!response.data || !response.data.productUpdate) {
      console.error(`❌ Invalid response for "${productTitle}"`);
      return false;
    }
    
    const { productUpdate } = response.data;
    
    if (productUpdate.userErrors.length > 0) {
      console.error(`❌ Error publishing "${productTitle}":`, productUpdate.userErrors);
      return false;
    }
    
    console.log(`✅ Published "${productTitle}" - Status: ${productUpdate.product.status}, Published: ${productUpdate.product.publishedAt ? 'YES' : 'NO'}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to publish "${productTitle}":`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 SIMPLE PRODUCT PUBLICATION FIX');
  console.log('==================================\n');
  
  // Get first few products to test
  const query = `
    query {
      products(first: 15) {
        edges {
          node {
            id
            title
            handle
            status
            publishedAt
          }
        }
      }
    }
  `;

  try {
    const response = await client.request(query);
    const products = response.data.products.edges.map(edge => edge.node);
    
    console.log(`📦 Found ${products.length} products to check\n`);
    
    let publishedCount = 0;
    
    for (const product of products) {
      // Skip test products
      if (product.title.includes('Test Product')) continue;
      
      if (!product.publishedAt && product.status === 'ACTIVE') {
        const success = await publishProductSimple(product.id, product.title);
        if (success) publishedCount++;
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.log(`⏭️  Skipping "${product.title}" - Already published or not active`);
      }
    }
    
    console.log(`\n🎉 Published ${publishedCount} products!`);
    
    // Wait a moment and verify
    console.log('\n⏰ Waiting 3 seconds for publication to take effect...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Verify one product
    const testProduct = products.find(p => p.title === 'Sage Green Morning Mug');
    if (testProduct) {
      const verifyQuery = `
        query {
          product(id: "${testProduct.id}") {
            id
            title
            publishedAt
            onlineStoreUrl
            status
          }
        }
      `;
      
      try {
        const verifyResponse = await client.request(verifyQuery);
        const product = verifyResponse.data.product;
        
        console.log('\n🧪 Verification of "Sage Green Morning Mug":');
        console.log(`   Status: ${product.status}`);
        console.log(`   Published: ${product.publishedAt || 'NO'}`);
        console.log(`   Online Store URL: ${product.onlineStoreUrl || 'NOT SET'}`);
        
      } catch (error) {
        console.error('❌ Error verifying product:', error.message);
      }
    }
    
    console.log('\n🧪 TEST THESE URLS NOW:');
    console.log('======================');
    console.log('1. https://burnroadceramics.com/collections/all');
    console.log('2. https://burnroadceramics.com/products/sage-green-morning-mug');
    console.log('\n⏰ Wait 1-2 minutes, then test the URLs above.');
    
  } catch (error) {
    console.error('❌ Error getting products:', error.message);
  }
}

main().catch(console.error);