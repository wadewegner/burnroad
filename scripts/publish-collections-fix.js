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

async function publishCollectionDirectly(collectionId, collectionTitle) {
  console.log(`📤 Publishing collection "${collectionTitle}" to Online Store...`);

  // Use collectionUpdate to publish the collection
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
      id: collectionId,
      published: true
    }
  };

  try {
    const response = await client.request(mutation, { variables });
    
    if (!response.data || !response.data.collectionUpdate) {
      console.error(`❌ Invalid response for "${collectionTitle}"`);
      return false;
    }
    
    const { collectionUpdate } = response.data;
    
    if (collectionUpdate.userErrors.length > 0) {
      console.error(`❌ Error publishing "${collectionTitle}":`, collectionUpdate.userErrors);
      return false;
    }
    
    console.log(`✅ Published "${collectionTitle}"`);
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to publish "${collectionTitle}":`, error.message);
    return false;
  }
}

async function checkCollectionPublicationStatus() {
  console.log('🔍 Checking collection publication status...\n');

  const query = `
    query {
      collections(first: 10) {
        edges {
          node {
            id
            title
            handle
            publishedAt
          }
        }
      }
    }
  `;

  try {
    const response = await client.request(query);
    const collections = response.data.collections.edges.map(edge => edge.node);
    
    console.log(`📚 Found ${collections.length} collections:\n`);
    
    const unpublished = [];
    
    collections.forEach(collection => {
      const isPublished = collection.publishedAt ? '✅' : '❌';
      console.log(`${isPublished} ${collection.title} (${collection.handle})`);
      console.log(`   Published: ${collection.publishedAt || 'NO'}`);
      console.log(`   URL: https://burnroadceramics.com/collections/${collection.handle}\n`);
      
      if (!collection.publishedAt && !collection.title.includes('Test')) {
        unpublished.push(collection);
      }
    });
    
    return unpublished;
  } catch (error) {
    console.error('❌ Error getting collections:', error.message);
    return [];
  }
}

async function main() {
  console.log('🚀 FIXING COLLECTION PUBLICATION');
  console.log('=================================\n');
  
  // Step 1: Check current status
  const unpublished = await checkCollectionPublicationStatus();
  
  if (unpublished.length === 0) {
    console.log('✅ All collections are already published!');
  } else {
    console.log(`📤 Publishing ${unpublished.length} unpublished collections...\n`);
    
    // Step 2: Publish each unpublished collection
    let successCount = 0;
    
    for (const collection of unpublished) {
      const success = await publishCollectionDirectly(collection.id, collection.title);
      if (success) successCount++;
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n🎉 Published ${successCount}/${unpublished.length} collections!`);
  }
  
  // Step 3: Wait and verify
  console.log('\n⏰ Waiting 5 seconds for publication to take effect...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Step 4: Verify specific collection
  console.log('\n🧪 Verifying "Functional Pottery" collection...');
  
  const verifyQuery = `
    query {
      collections(first: 1, query: "handle:functional-pottery") {
        edges {
          node {
            id
            title
            handle
            publishedAt
            onlineStoreUrl
          }
        }
      }
    }
  `;
  
  try {
    const verifyResponse = await client.request(verifyQuery);
    
    if (verifyResponse.data.collections.edges.length > 0) {
      const collection = verifyResponse.data.collections.edges[0].node;
      console.log(`   Title: ${collection.title}`);
      console.log(`   Handle: ${collection.handle}`);
      console.log(`   Published: ${collection.publishedAt || 'NO'}`);
      console.log(`   Online Store URL: ${collection.onlineStoreUrl || 'NOT SET'}`);
    }
  } catch (error) {
    console.error('❌ Error verifying collection:', error.message);
  }
  
  console.log('\n🧪 TEST THESE URLS NOW:');
  console.log('======================');
  console.log('1. https://burnroadceramics.com/collections/functional-pottery');
  console.log('2. https://burnroadceramics.com/collections/decorative-pieces');
  console.log('3. https://burnroadceramics.com/collections/all');
  
  console.log('\n⏰ Wait 1-2 minutes, then test the URLs above.');
}

main().catch(console.error);