const { createAdminApiClient } = require('@shopify/admin-api-client');
const fs = require('fs');

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

async function deleteProduct(productId, productTitle) {
  const mutation = `
    mutation productDelete($input: ProductDeleteInput!) {
      productDelete(input: $input) {
        deletedProductId
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      id: productId
    }
  };

  try {
    const response = await client.request(mutation, { variables });
    
    if (response && response.data && response.data.productDelete) {
      const { productDelete } = response.data;
      
      if (productDelete.userErrors.length > 0) {
        console.error(`❌ Error deleting "${productTitle}":`, productDelete.userErrors);
        return false;
      }
      
      if (productDelete.deletedProductId) {
        console.log(`✅ Deleted: "${productTitle}" (${productId})`);
        return true;
      }
    }
    
    console.error(`❌ Unexpected response for "${productTitle}"`, response);
    return false;
    
  } catch (error) {
    console.error(`❌ Failed to delete "${productTitle}":`, error.message);
    return false;
  }
}

async function removeDuplicates() {
  console.log('🗑️  REMOVING DUPLICATE PRODUCTS');
  console.log('================================\n');

  // Check if removal list exists
  if (!fs.existsSync('./duplicate-removal-list.json')) {
    console.error('❌ No duplicate-removal-list.json found. Please run: node find-duplicates.js first');
    process.exit(1);
  }

  // Load removal list
  const removalData = JSON.parse(fs.readFileSync('./duplicate-removal-list.json', 'utf8'));
  const candidates = removalData.candidates;

  console.log(`📋 Found ${candidates.length} products to remove`);
  console.log(`📅 Removal list created: ${new Date(removalData.timestamp).toLocaleString()}\n`);

  if (config.dryRun) {
    console.log('🔍 DRY RUN MODE: No actual deletions will be performed\n');
  }

  // Group by title for better organization
  const byTitle = {};
  candidates.forEach(product => {
    const baseTitle = product.title;
    if (!byTitle[baseTitle]) {
      byTitle[baseTitle] = [];
    }
    byTitle[baseTitle].push(product);
  });

  console.log('📦 Products to be removed by title:\n');
  Object.entries(byTitle).forEach(([title, products]) => {
    console.log(`🔄 "${title}" - ${products.length} duplicates to remove:`);
    products.forEach(product => {
      console.log(`   • ${product.handle} (${product.status})`);
    });
    console.log('');
  });

  // Confirm before proceeding
  if (!config.dryRun) {
    console.log('⚠️  WARNING: This will permanently delete the above products!');
    console.log('🔄 Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('🚀 Starting deletion process...\n');
  }

  let successCount = 0;
  let failCount = 0;

  // Delete products one by one
  for (const product of candidates) {
    if (config.dryRun) {
      console.log(`🔍 DRY RUN: Would delete "${product.title}" (${product.handle})`);
      successCount++;
    } else {
      const success = await deleteProduct(product.id, `${product.title} (${product.handle})`);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
      
      // Rate limiting - small delay between deletions
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('\n📊 REMOVAL SUMMARY');
  console.log('==================');
  console.log(`✅ Successfully removed: ${successCount} products`);
  if (failCount > 0) {
    console.log(`❌ Failed to remove: ${failCount} products`);
  }
  console.log(`📦 Remaining products should be: ${58 - successCount}`);

  if (!config.dryRun && successCount > 0) {
    // Archive the removal list
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveName = `./duplicate-removal-completed-${timestamp}.json`;
    fs.renameSync('./duplicate-removal-list.json', archiveName);
    console.log(`📁 Removal list archived as: ${archiveName}`);
    
    console.log('\n🔍 To verify cleanup was successful, run: node find-duplicates.js');
  }

  if (config.dryRun) {
    console.log('\n🔧 To perform actual removal, disable dryRun in config.js and run again');
  }
}

async function main() {
  try {
    await removeDuplicates();
  } catch (error) {
    console.error('❌ Removal process failed:', error.message);
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = { removeDuplicates, deleteProduct };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}