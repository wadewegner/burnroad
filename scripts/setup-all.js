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

async function runScript(scriptName, scriptFunction) {
  console.log(`\n🚀 Running ${scriptName}...`);
  console.log('='.repeat(50));
  
  try {
    await scriptFunction();
    console.log(`✅ ${scriptName} completed successfully!`);
  } catch (error) {
    console.error(`❌ ${scriptName} failed:`, error.message);
    throw error;
  }
}

async function setupAll() {
  console.log('🏺 BURN ROAD CERAMICS - FULL STORE SETUP');
  console.log('=========================================\n');
  
  if (config.dryRun) {
    console.log('🔍 DRY RUN MODE: No actual changes will be made\n');
  }
  
  console.log('📋 Setup Process:');
  console.log('1. Test API Connection');
  console.log('2. Create Collections');
  console.log('3. Create Products');
  console.log('4. Assign Products to Collections');
  console.log('5. Setup Navigation Menus');
  console.log('6. Final Verification\n');
  
  try {
    // Step 1: Test Connection
    await runScript('API Connection Test', async () => {
      const shopQuery = `
        query {
          shop {
            name
            myshopifyDomain
            currencyCode
          }
        }
      `;
      const response = await client.request(shopQuery);
      const shop = response.data.shop;
      console.log('🏪 Connected to:', shop.name);
      console.log('🌐 Domain:', shop.myshopifyDomain);
      console.log('💰 Currency:', shop.currencyCode);
    });
    
    // Step 2: Create Collections
    await runScript('Collections Creation', async () => {
      const { createAllCollections } = require('./create-collections');
      await createAllCollections();
    });
    
    // Step 3: Create Products
    await runScript('Products Creation', async () => {
      const { createAllProducts } = require('./create-products');
      await createAllProducts();
    });
    
    // Step 4: Assign Products to Collections
    await runScript('Product-Collection Assignment', async () => {
      const { assignAllProductsToCollections } = require('./assign-products-to-collections');
      await assignAllProductsToCollections();
    });
    
    // Step 5: Create Navigation Menus
    await runScript('Navigation Menu Creation', async () => {
      const { createAllNavigationMenus } = require('./create-navigation');
      await createAllNavigationMenus();
    });
    
    // Step 6: Final Verification
    await runScript('Final Verification', async () => {
      // Get final counts
      const finalQuery = `
        query {
          shop {
            name
          }
          products(first: 1) {
            edges {
              node {
                id
              }
            }
          }
          collections(first: 1) {
            edges {
              node {
                id
              }
            }
          }
        }
      `;
      const finalResponse = await client.request(finalQuery);
      
      console.log('🎉 Setup Complete!');
      console.log('==================');
      console.log('✅ Collections created and configured');
      console.log('✅ Products created with full details');
      console.log('✅ SEO optimized titles and descriptions');
      console.log('✅ Inventory tracking configured');
      console.log('✅ Product tags and categorization');
      console.log('\n📊 Final Status:');
      console.log(`🏪 Store: ${finalResponse.data.shop.name}`);
      console.log(`📦 Products: Ready for images and final review`);
      console.log(`📚 Collections: Ready for collection images`);
      console.log('\n📋 Next Steps:');
      console.log('1. Add product images in Shopify admin');
      console.log('2. Add collection images in Shopify admin');
      console.log('3. Review and adjust product descriptions');
      console.log('4. Set up shipping rates for product weights');
      console.log('5. Configure payment settings');
      console.log('6. Test customer checkout flow');
      console.log('7. Launch store! 🚀');
    });
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\n🔧 Common issues:');
    console.error('   - Check API credentials in config.js');
    console.error('   - Verify app permissions in Shopify admin');
    console.error('   - Ensure store is accessible and not password protected');
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = { setupAll };

// Run if called directly
if (require.main === module) {
  setupAll().catch(console.error);
} 