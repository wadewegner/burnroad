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

async function getAllCollectionsWithProducts() {
  console.log('🔍 Getting all collections with product counts...\n');

  const query = `
    query {
      collections(first: 20) {
        edges {
          node {
            id
            title
            handle
            productsCount
            products(first: 5) {
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
        }
      }
    }
  `;

  try {
    const response = await client.request(query);
    
    if (!response.data || !response.data.collections) {
      console.error('❌ Invalid response');
      return;
    }
    
    const collections = response.data.collections.edges.map(edge => edge.node);
    
    console.log(`📚 Found ${collections.length} collections:\n`);
    
    for (const collection of collections) {
      console.log(`📂 ${collection.title} (${collection.handle})`);
      console.log(`   Products: ${collection.productsCount || collection.products.edges.length}`);
      console.log(`   URL: https://burnroadceramics.com/collections/${collection.handle}`);
      
      if (collection.products.edges.length > 0) {
        console.log(`   Sample products:`);
        collection.products.edges.forEach(edge => {
          console.log(`     - ${edge.node.title} (${edge.node.status})`);
        });
      } else {
        console.log(`   ⚠️  No products found`);
      }
      console.log('');
    }
    
    return collections;
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.graphQLErrors) {
      console.error('GraphQL errors:', JSON.stringify(error.graphQLErrors, null, 2));
    }
  }
}

async function checkSpecificCollection(handle) {
  console.log(`\n🔍 Checking collection "${handle}" specifically...\n`);

  // Use collections query with filter
  const query = `
    query {
      collections(first: 10, query: "handle:${handle}") {
        edges {
          node {
            id
            title
            handle
            productsCount
            products(first: 10) {
              edges {
                node {
                  title
                  handle
                  status
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
      console.log(`✅ Found: ${collection.title}`);
      console.log(`📦 Products: ${collection.productsCount || collection.products.edges.length}`);
      console.log(`🔗 URL: https://burnroadceramics.com/collections/${collection.handle}`);
      
      if (collection.products.edges.length > 0) {
        console.log(`📋 Products in collection:`);
        collection.products.edges.forEach(edge => {
          console.log(`   - ${edge.node.title} (${edge.node.status})`);
        });
      } else {
        console.log(`⚠️  This collection has no products! This is why the page shows "not found"`);
      }
    } else {
      console.log(`❌ Collection "${handle}" not found`);
    }
  } catch (error) {
    console.error(`❌ Error checking ${handle}:`, error.message);
  }
}

async function main() {
  console.log('🚀 FINAL COLLECTION DIAGNOSIS');
  console.log('=============================\n');
  
  // Get all collections
  const collections = await getAllCollectionsWithProducts();
  
  // Check our main pottery collections specifically
  const mainCollections = ['functional-pottery', 'decorative-pieces', 'sets-bundles', 'seconds'];
  
  for (const handle of mainCollections) {
    await checkSpecificCollection(handle);
  }
  
  console.log('\n🎯 ANALYSIS SUMMARY:');
  console.log('===================\n');
  console.log('If collections show "Page not found", possible causes:');
  console.log('1. **No products in collections** - Empty collections return 404');
  console.log('2. **Theme missing collection.liquid template**');
  console.log('3. **Collections not published to Online Store**');
  console.log('4. **URL routing issues**');
  
  console.log('\n🔧 IMMEDIATE FIXES TO TRY:');
  console.log('==========================\n');
  console.log('1. **Test the "all" collection first**:');
  console.log('   https://burnroadceramics.com/collections/all');
  console.log('   (This should work regardless of individual collections)');
  console.log('\n2. **Check individual product URLs**:');
  console.log('   https://burnroadceramics.com/products/sage-green-morning-mug');
  console.log('   (Test if products themselves are accessible)');
  console.log('\n3. **In Shopify Admin**:');
  console.log('   - Go to Products → Collections');
  console.log('   - Click on "Functional Pottery"');
  console.log('   - Look for a "View collection" or "Preview" link');
  console.log('   - This will tell you if the collection page works at all');
}

main().catch(console.error);