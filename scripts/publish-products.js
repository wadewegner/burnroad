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

async function getProductsAndPublications() {
  console.log('🔍 Checking product publication status...\n');

  // Get all products with their publication status
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
            publications(first: 10) {
              edges {
                node {
                  name
                  id
                }
              }
            }
          }
        }
      }
      publications(first: 10) {
        edges {
          node {
            id
            name
            supportsFuturePublishing
          }
        }
      }
    }
  `;

  try {
    const response = await client.request(query);
    
    if (!response || !response.data) {
      console.error('❌ Invalid response structure:', response);
      return;
    }
    
    const products = response.data.products.edges.map(edge => edge.node);
    const publications = response.data.publications.edges.map(edge => edge.node);

    console.log(`📦 Found ${products.length} products`);
    console.log(`📡 Available publications:`, publications.map(p => p.name).join(', '));
    
    // Find the Online Store publication
    const onlineStore = publications.find(p => p.name === 'Online Store');
    
    if (!onlineStore) {
      console.error('❌ Could not find "Online Store" publication channel');
      return;
    }

    console.log(`\n🌐 Online Store Publication ID: ${onlineStore.id}\n`);

    // Check which products are not published to Online Store
    const unpublishedProducts = [];
    
    for (const product of products) {
      const isPublishedToOnlineStore = product.publications.edges.some(
        pub => pub.node.name === 'Online Store'
      );
      
      console.log(`📋 ${product.title}: ${product.status} - Published to Online Store: ${isPublishedToOnlineStore ? '✅' : '❌'}`);
      
      if (!isPublishedToOnlineStore && product.status === 'ACTIVE') {
        unpublishedProducts.push(product);
      }
    }

    if (unpublishedProducts.length > 0) {
      console.log(`\n🚀 Publishing ${unpublishedProducts.length} products to Online Store...\n`);
      
      for (const product of unpublishedProducts) {
        await publishProductToOnlineStore(product.id, onlineStore.id);
        await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
      }
    } else {
      console.log('\n✅ All active products are already published to Online Store!');
    }

  } catch (error) {
    console.error('❌ Failed to get products:', error.message);
    if (error.graphQLErrors) {
      console.error('GraphQL errors:', error.graphQLErrors);
    }
  }
}

async function publishProductToOnlineStore(productId, publicationId) {
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
        publicationId: publicationId
      }
    ]
  };

  try {
    const response = await client.request(mutation, { variables });
    
    if (response.data.publishablePublish.userErrors.length > 0) {
      console.error(`❌ Error publishing product:`, response.data.publishablePublish.userErrors);
      return false;
    }
    
    console.log(`✅ Published product to Online Store`);
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to publish product:`, error.message);
    return false;
  }
}

async function checkCollectionPublications() {
  console.log('\n🔍 Checking collection publication status...\n');

  const query = `
    query {
      collections(first: 50) {
        edges {
          node {
            id
            title
            handle
            publications(first: 10) {
              edges {
                node {
                  name
                  id
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
    
    if (!response || !response.data) {
      console.error('❌ Invalid response structure:', response);
      return;
    }
    
    const collections = response.data.collections.edges.map(edge => edge.node);

    console.log(`📚 Found ${collections.length} collections`);
    
    for (const collection of collections) {
      const isPublishedToOnlineStore = collection.publications.edges.some(
        pub => pub.node.name === 'Online Store'
      );
      
      console.log(`📂 ${collection.title}: Published to Online Store: ${isPublishedToOnlineStore ? '✅' : '❌'}`);
    }

  } catch (error) {
    console.error('❌ Failed to get collections:', error.message);
  }
}

async function main() {
  console.log('🚀 PRODUCT PUBLICATION CHECKER');
  console.log('==============================\n');
  
  await getProductsAndPublications();
  await checkCollectionPublications();
  
  console.log('\n🎉 Publication check complete!');
  console.log('\n📋 Next steps if products still don\'t show:');
  console.log('1. Check theme settings in Shopify admin');
  console.log('2. Assign navigation menus to header/footer');
  console.log('3. Verify collection pages are enabled in theme');
  console.log('4. Check if theme has a "Shop" or "Products" page template');
}

main().catch(console.error);