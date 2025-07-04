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

async function assignProductToCollection(productId, collectionId) {
  const mutation = `
    mutation collectionAddProducts($id: ID!, $productIds: [ID!]!) {
      collectionAddProducts(id: $id, productIds: $productIds) {
        collection {
          id
          title
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    id: collectionId,
    productIds: [productId]
  };

  if (config.dryRun) {
    console.log(`🔍 DRY RUN: Would assign product ${productId} to collection ${collectionId}`);
    return { success: true };
  }

  try {
    const response = await client.request(mutation, { variables });

    if (!response || !response.data || !response.data.collectionAddProducts) {
      console.error(`❌ Unexpected response structure:`, response);
      return { success: false, error: 'Unexpected response structure' };
    }

    const { collectionAddProducts } = response.data;

    if (collectionAddProducts.userErrors.length > 0) {
      console.error(`❌ Error assigning product to collection:`, collectionAddProducts.userErrors);
      return { success: false, errors: collectionAddProducts.userErrors };
    }

    return { success: true, data: collectionAddProducts.collection };

  } catch (error) {
    console.error(`❌ Failed to assign product to collection:`, error.message);
    return { success: false, error: error.message };
  }
}

async function getCollectionsAndProducts() {
  // Get all collections
  const collectionsQuery = `
    query {
      collections(first: 50) {
        edges {
          node {
            id
            handle
            title
          }
        }
      }
    }
  `;

  // Get all products with tags
  const productsQuery = `
    query {
      products(first: 50) {
        edges {
          node {
            id
            handle
            title
            tags
          }
        }
      }
    }
  `;

  try {
    const collectionsResponse = await client.request(collectionsQuery);
    const collections = collectionsResponse.data.collections.edges.map(edge => edge.node);

    const productsResponse = await client.request(productsQuery);
    const products = productsResponse.data.products.edges.map(edge => edge.node);

    return { collections, products };
  } catch (error) {
    console.error('❌ Failed to fetch collections and products:', error.message);
    throw error;
  }
}

function determineProductCollections(product, collections) {
  const assignments = [];
  const productTags = product.tags || [];
  const productHandle = product.handle;

  // Create a map for easy collection lookup
  const collectionMap = collections.reduce((map, collection) => {
    map[collection.handle] = collection;
    return map;
  }, {});

  // This Month's Kiln Load - assign featured products
  if (productTags.includes('functional-pottery') || 
      productTags.includes('decorative') || 
      productTags.includes('gift-ready')) {
    const kilnCollection = collectionMap['this-months-kiln-load'];
    if (kilnCollection) {
      assignments.push({
        productId: product.id,
        collectionId: kilnCollection.id,
        collectionTitle: kilnCollection.title,
        reason: 'Featured in kiln load'
      });
    }
  }

  // Functional Pottery
  if (productTags.includes('functional-pottery') || 
      productTags.includes('food-safe') ||
      productTags.includes('mug') ||
      productTags.includes('bowl') ||
      productTags.includes('plate')) {
    const functionalCollection = collectionMap['functional-pottery'];
    if (functionalCollection) {
      assignments.push({
        productId: product.id,
        collectionId: functionalCollection.id,
        collectionTitle: functionalCollection.title,
        reason: 'Functional pottery item'
      });
    }
  }

  // Decorative Pieces
  if (productTags.includes('decorative') || 
      productTags.includes('vase') || 
      productTags.includes('planter') ||
      productHandle.includes('decorative')) {
    const decorativeCollection = collectionMap['decorative-pieces'];
    if (decorativeCollection) {
      assignments.push({
        productId: product.id,
        collectionId: decorativeCollection.id,
        collectionTitle: decorativeCollection.title,
        reason: 'Decorative piece'
      });
    }
  }

  // Sets & Bundles
  if (productTags.includes('set') || 
      productTags.includes('gift-ready') ||
      productHandle.includes('set') ||
      productHandle.includes('bundle')) {
    const setsCollection = collectionMap['sets-bundles'];
    if (setsCollection) {
      assignments.push({
        productId: product.id,
        collectionId: setsCollection.id,
        collectionTitle: setsCollection.title,
        reason: 'Set or bundle item'
      });
    }
  }

  // Seconds
  if (productTags.includes('seconds') || 
      productHandle.includes('seconds')) {
    const secondsCollection = collectionMap['seconds'];
    if (secondsCollection) {
      assignments.push({
        productId: product.id,
        collectionId: secondsCollection.id,
        collectionTitle: secondsCollection.title,
        reason: 'Seconds item'
      });
    }
  }

  return assignments;
}

async function assignAllProductsToCollections() {
  console.log('🔗 Assigning Products to Collections...\n');

  if (config.dryRun) {
    console.log('🔍 DRY RUN MODE: No actual changes will be made\n');
  }

  try {
    const { collections, products } = await getCollectionsAndProducts();

    console.log(`📚 Found ${collections.length} collections`);
    console.log(`📦 Found ${products.length} products`);

    // Determine all assignments
    let allAssignments = [];
    for (const product of products) {
      const productAssignments = determineProductCollections(product, collections);
      allAssignments = allAssignments.concat(productAssignments);
    }

    console.log(`\n🔗 Planning ${allAssignments.length} product-collection assignments:`);

    // Display planned assignments
    for (const assignment of allAssignments) {
      const product = products.find(p => p.id === assignment.productId);
      console.log(`📎 "${product.title}" → "${assignment.collectionTitle}" (${assignment.reason})`);
    }

    if (allAssignments.length === 0) {
      console.log('⚠️  No assignments to make. Check your product tags and collection handles.');
      return;
    }

    console.log(`\n🚀 Executing assignments...`);

    const results = [];
    for (const assignment of allAssignments) {
      const result = await assignProductToCollection(assignment.productId, assignment.collectionId);
      results.push({
        ...result,
        assignment
      });

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Summary
    console.log('\n📊 Assignment Summary:');
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`✅ Successfully assigned: ${successful} products to collections`);
    if (failed > 0) {
      console.log(`❌ Failed assignments: ${failed}`);
      
      // Show failed assignments
      const failedResults = results.filter(r => !r.success);
      for (const failure of failedResults) {
        const product = products.find(p => p.id === failure.assignment.productId);
        console.log(`   ❌ "${product.title}" → "${failure.assignment.collectionTitle}": ${failure.error}`);
      }
    }

    console.log('\n🎉 Product-collection assignment complete!');

    if (!config.dryRun) {
      console.log('\n📋 Next steps:');
      console.log('1. Check your collections in Shopify admin');
      console.log('2. Verify products appear in correct collections');
      console.log('3. Test collection pages on your storefront');
      console.log('4. Adjust collection order and featured products if needed');
    }

  } catch (error) {
    console.error('\n❌ Assignment failed:', error.message);
    console.error('\n🔧 Common issues:');
    console.error('   - Check API credentials in config.js');
    console.error('   - Verify app permissions include product and collection write access');
    console.error('   - Ensure collections and products exist in your store');
    process.exit(1);
  }
}

// Export the function for use in other scripts
module.exports = { assignAllProductsToCollections };

// Run the script if called directly
if (require.main === module) {
  assignAllProductsToCollections().catch(console.error);
}