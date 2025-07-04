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

async function testSingleAssignment() {
  console.log('🧪 Testing single product assignment...\n');

  // Get one specific product and collection
  const productQuery = `
    query {
      products(first: 1, query: "title:Sage Green Morning Mug") {
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

  const collectionQuery = `
    query {
      collections(first: 1, query: "handle:functional-pottery") {
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
    const [productResponse, collectionResponse] = await Promise.all([
      client.request(productQuery),
      client.request(collectionQuery)
    ]);

    if (productResponse.data.products.edges.length === 0) {
      console.error('❌ Product not found');
      return;
    }

    if (collectionResponse.data.collections.edges.length === 0) {
      console.error('❌ Collection not found');
      return;
    }

    const product = productResponse.data.products.edges[0].node;
    const collection = collectionResponse.data.collections.edges[0].node;

    console.log(`📦 Product: ${product.title} (${product.id})`);
    console.log(`📚 Collection: ${collection.title} (${collection.id})\n`);

    // Try assignment
    const mutation = `
      mutation collectionAddProducts($id: ID!, $productIds: [ID!]!) {
        collectionAddProducts(id: $id, productIds: $productIds) {
          collection {
            id
            title
            productsCount
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      id: collection.id,
      productIds: [product.id]
    };

    console.log('🔗 Attempting assignment...');
    console.log('Variables:', JSON.stringify(variables, null, 2));

    const response = await client.request(mutation, { variables });
    console.log('Response:', JSON.stringify(response, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.graphQLErrors) {
      console.error('GraphQL errors:', JSON.stringify(error.graphQLErrors, null, 2));
    }
  }
}

testSingleAssignment().catch(console.error);