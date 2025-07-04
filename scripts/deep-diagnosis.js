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

async function checkStoreAndChannels() {
  console.log('🔍 Deep diagnosis of store configuration...\n');

  // Check store info and primary domain
  const storeQuery = `
    query {
      shop {
        name
        primaryDomain {
          host
          url
        }
        myshopifyDomain
        plan {
          displayName
        }
        checkoutApiSupported
      }
    }
  `;

  try {
    const response = await client.request(storeQuery);
    const shop = response.data.shop;
    
    console.log('🏪 STORE INFORMATION:');
    console.log(`   Name: ${shop.name}`);
    console.log(`   Primary Domain: ${shop.primaryDomain.host}`);
    console.log(`   Primary URL: ${shop.primaryDomain.url}`);
    console.log(`   Myshopify Domain: ${shop.myshopifyDomain}`);
    console.log(`   Plan: ${shop.plan.displayName}`);
    console.log(`   Checkout API: ${shop.checkoutApiSupported ? 'Supported' : 'Not Supported'}`);
    
    return shop;
  } catch (error) {
    console.error('❌ Error getting store info:', error.message);
    return null;
  }
}

async function checkPublications() {
  console.log('\n📡 CHECKING PUBLICATIONS/SALES CHANNELS:');
  
  const pubQuery = `
    query {
      publications(first: 10) {
        edges {
          node {
            id
            name
            supportsFuturePublishing
            app {
              id
              title
            }
          }
        }
      }
    }
  `;

  try {
    const response = await client.request(pubQuery);
    const publications = response.data.publications.edges.map(edge => edge.node);
    
    console.log(`   Found ${publications.length} sales channels:`);
    publications.forEach(pub => {
      console.log(`   - ${pub.name} (ID: ${pub.id})`);
      if (pub.app) {
        console.log(`     App: ${pub.app.title}`);
      }
    });
    
    return publications;
  } catch (error) {
    console.error('❌ Error getting publications:', error.message);
    return [];
  }
}

async function checkProductsDetailed() {
  console.log('\n📦 DETAILED PRODUCT ANALYSIS:');
  
  const productQuery = `
    query {
      products(first: 5) {
        edges {
          node {
            id
            title
            handle
            status
            publishedAt
            onlineStoreUrl
            onlineStorePreviewUrl
            createdAt
            updatedAt
            vendor
            productType
            totalInventory
            hasOnlyDefaultVariant
            totalVariants
            options(first: 3) {
              id
              name
              values
            }
            variants(first: 3) {
              edges {
                node {
                  id
                  title
                  price
                  compareAtPrice
                  sku
                  inventoryQuantity
                  availableForSale
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await client.request(productQuery);
    const products = response.data.products.edges.map(edge => edge.node);
    
    console.log(`   Found ${products.length} products:`);
    
    products.forEach((product, index) => {
      console.log(`\n   ${index + 1}. ${product.title}`);
      console.log(`      Handle: ${product.handle}`);
      console.log(`      Status: ${product.status}`);
      console.log(`      Published At: ${product.publishedAt || 'NOT PUBLISHED'}`);
      console.log(`      Online Store URL: ${product.onlineStoreUrl || 'NOT SET'}`);
      console.log(`      Online Store Preview: ${product.onlineStorePreviewUrl || 'NOT SET'}`);
      console.log(`      Created: ${product.createdAt}`);
      console.log(`      Updated: ${product.updatedAt}`);
      console.log(`      Vendor: ${product.vendor}`);
      console.log(`      Type: ${product.productType}`);
      console.log(`      Total Inventory: ${product.totalInventory}`);
      console.log(`      Total Variants: ${product.totalVariants}`);
      console.log(`      Has Only Default Variant: ${product.hasOnlyDefaultVariant}`);
      
      if (product.variants.edges.length > 0) {
        console.log(`      Variants:`);
        product.variants.edges.forEach(variant => {
          const v = variant.node;
          console.log(`        - ${v.title}: $${v.price} (SKU: ${v.sku || 'none'}, Qty: ${v.inventoryQuantity}, Available: ${v.availableForSale})`);
        });
      }
      
      if (product.options.length > 0) {
        console.log(`      Options:`);
        product.options.forEach(option => {
          console.log(`        - ${option.name}: [${option.values.join(', ')}]`);
        });
      }
    });
    
    return products;
  } catch (error) {
    console.error('❌ Error getting detailed products:', error.message);
    return [];
  }
}

async function checkOnlineStoreChannel() {
  console.log('\n🌐 CHECKING ONLINE STORE SPECIFIC SETTINGS:');
  
  // Try to get the Online Store publication specifically
  const osQuery = `
    query {
      publication(id: "gid://shopify/Publication/1") {
        id
        name
        supportsFuturePublishing
        products(first: 5) {
          edges {
            node {
              id
              title
              handle
            }
          }
        }
        collections(first: 5) {
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
    const response = await client.request(osQuery);
    
    if (response.data.publication) {
      const pub = response.data.publication;
      console.log(`   Online Store Channel Found: ${pub.name}`);
      console.log(`   Products in Online Store: ${pub.products.edges.length}`);
      console.log(`   Collections in Online Store: ${pub.collections.edges.length}`);
      
      if (pub.products.edges.length > 0) {
        console.log(`   Sample products in Online Store:`);
        pub.products.edges.forEach(edge => {
          console.log(`     - ${edge.node.title} (${edge.node.handle})`);
        });
      } else {
        console.log(`   ⚠️  NO PRODUCTS PUBLISHED TO ONLINE STORE!`);
      }
    } else {
      console.log(`   ❌ Online Store channel not found or not accessible`);
    }
  } catch (error) {
    console.error('❌ Error checking Online Store channel:', error.message);
    if (error.graphQLErrors) {
      console.error('   GraphQL Errors:', JSON.stringify(error.graphQLErrors, null, 2));
    }
  }
}

async function main() {
  console.log('🚀 DEEP STORE DIAGNOSIS');
  console.log('======================\n');
  
  const store = await checkStoreAndChannels();
  const publications = await checkPublications();
  const products = await checkProductsDetailed();
  await checkOnlineStoreChannel();
  
  console.log('\n🎯 DIAGNOSIS SUMMARY:');
  console.log('====================\n');
  
  if (store) {
    if (store.primaryDomain.host === 'burnroadceramics.com') {
      console.log('✅ Domain is correctly set to burnroadceramics.com');
    } else {
      console.log('❌ Primary domain issue detected');
    }
  }
  
  const hasOnlineStore = publications.some(pub => pub.name === 'Online Store');
  if (hasOnlineStore) {
    console.log('✅ Online Store sales channel exists');
  } else {
    console.log('❌ Online Store sales channel missing or not found');
  }
  
  if (products.length > 0) {
    const publishedProducts = products.filter(p => p.publishedAt);
    const withOnlineStoreUrl = products.filter(p => p.onlineStoreUrl);
    
    console.log(`📊 Product Status:`);
    console.log(`   Total products: ${products.length}`);
    console.log(`   Published products: ${publishedProducts.length}`);
    console.log(`   Products with Online Store URL: ${withOnlineStoreUrl.length}`);
    
    if (publishedProducts.length === 0) {
      console.log('❌ CRITICAL: No products are published!');
    }
    
    if (withOnlineStoreUrl.length === 0) {
      console.log('❌ CRITICAL: No products have Online Store URLs!');
    }
  }
  
  console.log('\n💡 NEXT STEPS:');
  console.log('==============');
  console.log('1. Check if products are published to Online Store channel');
  console.log('2. Verify Online Store channel is active and configured');
  console.log('3. Check if there are any theme or template issues');
  console.log('4. Verify domain DNS settings and SSL certificate');
}

main().catch(console.error);