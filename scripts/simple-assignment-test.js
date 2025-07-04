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

async function simplestAssignment() {
  console.log('🧪 Simplest assignment test...\n');

  // Try assignment with minimal response
  const mutation = `
    mutation collectionAddProducts($id: ID!, $productIds: [ID!]!) {
      collectionAddProducts(id: $id, productIds: $productIds) {
        collection {
          id
          title
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    id: "gid://shopify/Collection/328209334410", // Functional Pottery
    productIds: ["gid://shopify/Product/8612807704714"] // Sage Green Morning Mug
  };

  console.log('🔗 Attempting assignment...');

  try {
    const response = await client.request(mutation, { variables });
    
    if (response.data && response.data.collectionAddProducts) {
      const result = response.data.collectionAddProducts;
      
      if (result.userErrors.length > 0) {
        console.error('❌ User errors:', result.userErrors);
      } else {
        console.log('✅ SUCCESS! Product assigned to collection');
        console.log(`   Collection: ${result.collection.title}`);
        console.log(`   Collection ID: ${result.collection.id}`);
      }
    } else {
      console.error('❌ Unexpected response structure:', response);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.graphQLErrors) {
      console.error('GraphQL errors:', JSON.stringify(error.graphQLErrors, null, 2));
    }
  }
}

async function testCollection() {
  console.log('\n🧪 Testing collection after assignment...\n');

  const query = `
    query {
      collection(id: "gid://shopify/Collection/328209334410") {
        id
        title
        handle
        products(first: 5) {
          edges {
            node {
              id
              title
              handle
            }
          }
        }
      }
    }
  `;

  try {
    const response = await client.request(query);
    
    if (response.data && response.data.collection) {
      const collection = response.data.collection;
      console.log(`📚 Collection: ${collection.title}`);
      console.log(`🔗 Handle: ${collection.handle}`);
      console.log(`📦 Products: ${collection.products.edges.length}`);
      
      collection.products.edges.forEach(edge => {
        console.log(`   - ${edge.node.title} (${edge.node.handle})`);
      });
      
      console.log(`\n🧪 Test URL: https://burnroadceramics.com/collections/${collection.handle}`);
    } else {
      console.error('❌ Collection not found');
    }

  } catch (error) {
    console.error('❌ Error getting collection:', error.message);
  }
}

async function main() {
  await simplestAssignment();
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
  await testCollection();
}

main().catch(console.error);