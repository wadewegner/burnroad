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

async function checkCollectionProducts() {
  console.log('🔍 Checking collection contents...\n');

  const query = `
    query {
      collection(handle: "functional-pottery") {
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
  `;

  try {
    const response = await client.request(query);
    console.log('Functional Pottery Collection:', JSON.stringify(response, null, 2));
    
    if (response.data.collection) {
      const collection = response.data.collection;
      console.log(`\n✅ Collection "${collection.title}" exists`);
      console.log(`📦 Contains ${collection.products.edges.length} products`);
      
      collection.products.edges.forEach(edge => {
        console.log(`  - ${edge.node.title} (${edge.node.handle})`);
      });
    } else {
      console.log('❌ Collection not found');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.graphQLErrors) {
      console.error('GraphQL errors:', JSON.stringify(error.graphQLErrors, null, 2));
    }
  }
}

async function checkStoreInfo() {
  console.log('\n🏪 Checking store configuration...\n');

  const query = `
    query {
      shop {
        name
        primaryDomain {
          host
          url
        }
        plan {
          displayName
        }
      }
    }
  `;

  try {
    const response = await client.request(query);
    console.log('Store info:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('❌ Error getting store info:', error.message);
  }
}

async function testAllCollections() {
  console.log('\n🧪 Testing all pottery collections...\n');

  const handles = ['functional-pottery', 'decorative-pieces', 'sets-bundles', 'seconds'];
  
  for (const handle of handles) {
    console.log(`\n📂 Testing collection: ${handle}`);
    
    const query = `
      query {
        collection(handle: "${handle}") {
          id
          title
          handle
          productsCount
          products(first: 3) {
            edges {
              node {
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
      
      if (response.data.collection) {
        const collection = response.data.collection;
        console.log(`  ✅ Exists: "${collection.title}"`);
        console.log(`  📦 Product count: ${collection.productsCount || collection.products.edges.length}`);
        console.log(`  🔗 URL: https://burnroadceramics.com/collections/${handle}`);
      } else {
        console.log(`  ❌ Collection "${handle}" not found`);
      }
    } catch (error) {
      console.log(`  ❌ Error checking "${handle}":`, error.message);
    }
  }
}

async function main() {
  console.log('🚀 COLLECTION CONTENT ANALYSIS');
  console.log('==============================\n');
  
  await checkStoreInfo();
  await checkCollectionProducts();
  await testAllCollections();
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('==============\n');
  console.log('1. **Check your theme in Shopify Admin**:');
  console.log('   - Go to: Online Store → Themes');
  console.log('   - Click "Customize" on your active theme');
  console.log('   - Look for collection page templates');
  console.log('\n2. **Test collection URLs directly**:');
  console.log('   - Try: https://burnroadceramics.com/collections/all');
  console.log('   - This should show ALL products regardless of collections');
  console.log('\n3. **Check if Online Store is your primary domain**:');
  console.log('   - Settings → Domains');
  console.log('   - Ensure burnroadceramics.com is the primary domain');
  console.log('\n4. **Manual Admin Check**:');
  console.log('   - Products → Collections → Functional Pottery');
  console.log('   - Click "View collection" link');
  console.log('   - See if it opens the collection page');
}

main().catch(console.error);