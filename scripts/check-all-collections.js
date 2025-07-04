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

async function checkCollection(handle, title) {
  console.log(`\n📚 Checking ${title}...`);

  const query = `
    query {
      collections(first: 1, query: "handle:${handle}") {
        edges {
          node {
            id
            title
            handle
            products(first: 10) {
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
      }
    }
  `;

  try {
    const response = await client.request(query);
    
    if (response.data && response.data.collections.edges.length > 0) {
      const collection = response.data.collections.edges[0].node;
      const productCount = collection.products.edges.length;
      
      console.log(`   Handle: ${collection.handle}`);
      console.log(`   Products: ${productCount}`);
      console.log(`   URL: https://burnroadceramics.com/collections/${collection.handle}`);
      console.log(`   Status: ${productCount > 0 ? '✅ HAS PRODUCTS' : '❌ EMPTY'}`);
      
      if (productCount > 0) {
        console.log(`   Sample products:`);
        collection.products.edges.slice(0, 3).forEach(edge => {
          console.log(`     - ${edge.node.title}`);
        });
      }
      
      return productCount > 0;
    } else {
      console.log(`   ❌ Collection not found`);
      return false;
    }

  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 CHECKING ALL COLLECTION STATUS');
  console.log('==================================');

  const collections = [
    { handle: 'functional-pottery', title: 'Functional Pottery' },
    { handle: 'decorative-pieces', title: 'Decorative Pieces' },
    { handle: 'sets-bundles', title: 'Sets & Bundles' },
    { handle: 'seconds', title: 'Seconds' },
    { handle: 'this-months-kiln-load', title: "This Month's Kiln Load" }
  ];

  const results = [];
  
  for (const collection of collections) {
    const hasProducts = await checkCollection(collection.handle, collection.title);
    results.push({ ...collection, hasProducts });
  }

  console.log('\n📊 SUMMARY:');
  console.log('===========');
  
  const workingCollections = results.filter(r => r.hasProducts);
  const emptyCollections = results.filter(r => !r.hasProducts);
  
  console.log(`✅ Working collections: ${workingCollections.length}`);
  workingCollections.forEach(col => {
    console.log(`   - https://burnroadceramics.com/collections/${col.handle}`);
  });
  
  if (emptyCollections.length > 0) {
    console.log(`\n❌ Empty collections: ${emptyCollections.length}`);
    emptyCollections.forEach(col => {
      console.log(`   - ${col.title} (${col.handle})`);
    });
  }

  console.log('\n🧪 TEST THESE WORKING URLS NOW:');
  console.log('===============================');
  workingCollections.forEach(col => {
    console.log(`${col.title}: https://burnroadceramics.com/collections/${col.handle}`);
  });
}

main().catch(console.error);