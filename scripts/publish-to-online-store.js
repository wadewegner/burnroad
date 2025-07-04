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

async function getUnpublishedProducts() {
  console.log('🔍 Getting unpublished products...\n');

  const query = `
    query {
      products(first: 50) {
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
    
    // Filter for active products that aren't published
    const unpublished = products.filter(p => p.status === 'ACTIVE' && !p.publishedAt);
    
    console.log(`📦 Found ${products.length} total products`);
    console.log(`🚫 Found ${unpublished.length} unpublished active products`);
    
    return unpublished;
  } catch (error) {
    console.error('❌ Error getting products:', error.message);
    return [];
  }
}

async function publishProductToOnlineStore(productId, productTitle) {
  console.log(`📤 Publishing "${productTitle}" to Online Store...`);

  const mutation = `
    mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) {
        publishable {
          availablePublicationCount
          publicationCount
        }
        shop {
          publicationCount
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    id: productId,
    input: [
      {
        publicationId: "gid://shopify/Publication/163665772682" // Online Store ID from diagnosis
      }
    ]
  };

  try {
    const response = await client.request(mutation, { variables });
    
    if (response.data.publishablePublish.userErrors.length > 0) {
      console.error(`❌ Error publishing "${productTitle}":`, response.data.publishablePublish.userErrors);
      return false;
    }
    
    console.log(`✅ Successfully published "${productTitle}"`);
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to publish "${productTitle}":`, error.message);
    return false;
  }
}

async function publishCollectionsToOnlineStore() {
  console.log('\n📚 Publishing collections to Online Store...\n');

  // Get all collections
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
    
    console.log(`📂 Found ${collections.length} collections to publish`);
    
    for (const collection of collections) {
      if (collection.title.includes('Test')) continue; // Skip test collections
      
      console.log(`📤 Publishing collection "${collection.title}"...`);
      
      const mutation = `
        mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
          publishablePublish(id: $id, input: $input) {
            publishable {
              availablePublicationCount
              publicationCount
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
        input: [
          {
            publicationId: "gid://shopify/Publication/163665772682" // Online Store ID
          }
        ]
      };

      try {
        const pubResponse = await client.request(mutation, { variables });
        
        if (pubResponse.data.publishablePublish.userErrors.length > 0) {
          console.error(`❌ Error publishing collection "${collection.title}":`, pubResponse.data.publishablePublish.userErrors);
        } else {
          console.log(`✅ Published collection "${collection.title}"`);
        }
      } catch (error) {
        console.error(`❌ Failed to publish collection "${collection.title}":`, error.message);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } catch (error) {
    console.error('❌ Error getting collections:', error.message);
  }
}

async function verifyPublication() {
  console.log('\n🧪 Verifying publication status...\n');

  const query = `
    query {
      products(first: 5) {
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
    const response = await client.request(query);
    const products = response.data.products.edges.map(edge => edge.node);
    
    console.log('📋 Product publication status:');
    products.forEach(product => {
      const isPublished = product.publishedAt ? '✅' : '❌';
      const hasUrl = product.onlineStoreUrl ? '✅' : '❌';
      console.log(`   ${isPublished} ${product.title}`);
      console.log(`      Published: ${product.publishedAt || 'NO'}`);
      console.log(`      URL: ${product.onlineStoreUrl || 'NOT SET'}`);
    });
    
  } catch (error) {
    console.error('❌ Error verifying publication:', error.message);
  }
}

async function main() {
  console.log('🚀 PUBLISHING PRODUCTS TO ONLINE STORE');
  console.log('======================================\n');
  
  // Step 1: Get unpublished products
  const unpublished = await getUnpublishedProducts();
  
  if (unpublished.length === 0) {
    console.log('✅ All products are already published!');
    return;
  }
  
  // Step 2: Publish each product
  console.log(`\n📤 Publishing ${unpublished.length} products...\n`);
  
  let successCount = 0;
  for (const product of unpublished) {
    const success = await publishProductToOnlineStore(product.id, product.title);
    if (success) successCount++;
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Step 3: Publish collections
  await publishCollectionsToOnlineStore();
  
  // Step 4: Verify everything worked
  await verifyPublication();
  
  console.log(`\n🎉 PUBLICATION COMPLETE!`);
  console.log(`======================================`);
  console.log(`✅ Successfully published ${successCount}/${unpublished.length} products`);
  
  console.log(`\n🧪 TEST THESE URLS NOW:`);
  console.log(`======================================`);
  console.log(`1. https://burnroadceramics.com/collections/all`);
  console.log(`2. https://burnroadceramics.com/products/sage-green-morning-mug`);
  console.log(`3. https://burnroadceramics.com/collections/functional-pottery`);
  
  console.log(`\n⏰ Note: It may take 1-2 minutes for URLs to become active.`);
}

main().catch(console.error);