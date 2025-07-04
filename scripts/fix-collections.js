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

async function checkCollections() {
  console.log('🔍 Checking collections...\n');

  const query = `
    query {
      collections(first: 20) {
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
    const collections = response.data.collections.edges.map(edge => edge.node);
    
    console.log(`📚 Found ${collections.length} collections:`);
    collections.forEach(collection => {
      console.log(`  - ${collection.title} (${collection.handle})`);
    });
    
    return collections;
  } catch (error) {
    console.error('❌ Error getting collections:', error.message);
    return [];
  }
}

async function updateCollection(collectionId, collectionTitle) {
  console.log(`\n🔄 Updating collection "${collectionTitle}"...`);
  
  const mutation = `
    mutation collectionUpdate($input: CollectionInput!) {
      collectionUpdate(input: $input) {
        collection {
          id
          title
          handle
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
      id: collectionId
    }
  };

  try {
    const response = await client.request(mutation, { variables });
    
    if (response.data && response.data.collectionUpdate) {
      const { collectionUpdate } = response.data;
      
      if (collectionUpdate.userErrors.length > 0) {
        console.error(`❌ Error updating collection:`, collectionUpdate.userErrors);
        return false;
      }
      
      console.log(`✅ Updated "${collectionTitle}"`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Failed to update "${collectionTitle}":`, error.message);
    return false;
  }
}

async function testCollectionDirectly() {
  console.log('\n🧪 Testing collection creation directly...\n');
  
  const mutation = `
    mutation collectionCreate($input: CollectionInput!) {
      collectionCreate(input: $input) {
        collection {
          id
          title
          handle
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
      title: "Test Collection Direct",
      handle: "test-collection-direct",
      descriptionHtml: "Testing direct collection creation"
    }
  };

  try {
    const response = await client.request(mutation, { variables });
    console.log('Collection creation response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('❌ Error creating test collection:', error.message);
  }
}

async function main() {
  console.log('🚀 COLLECTION DIAGNOSIS & FIX');
  console.log('=============================\n');
  
  // Step 1: Check what collections exist
  const collections = await checkCollections();
  
  // Step 2: Try updating each collection to refresh them
  for (const collection of collections) {
    if (collection.title.includes('Test')) continue; // Skip test collections
    await updateCollection(collection.id, collection.title);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Step 3: Test if we can create a new collection
  await testCollectionDirectly();
  
  console.log('\n🔍 DIAGNOSIS RESULTS:');
  console.log('====================\n');
  console.log('1. Test these URLs after running:');
  console.log('   - https://burnroadceramics.com/collections/functional-pottery');
  console.log('   - https://burnroadceramics.com/collections/decorative-pieces');
  console.log('   - https://burnroadceramics.com/collections/all');
  console.log('\n2. If still not working, the issue might be:');
  console.log('   - Theme doesn\'t support collection pages');
  console.log('   - Collections not published to Online Store channel');
  console.log('   - DNS/domain setup issues');
  console.log('\n3. Manual check in Shopify Admin:');
  console.log('   - Go to Products → Collections');
  console.log('   - Click on "Functional Pottery"');
  console.log('   - Check "Search engine listing preview"');
  console.log('   - Verify it shows the correct URL');
}

main().catch(console.error);