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

async function getCollectionsAndProducts() {
  console.log('🔍 Getting collections and products...\n');

  // Get collections
  const collectionsQuery = `
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

  // Get published products with tags
  const productsQuery = `
    query {
      products(first: 50, query: "published_status:published") {
        edges {
          node {
            id
            title
            handle
            tags
            publishedAt
          }
        }
      }
    }
  `;

  try {
    const [collectionsResponse, productsResponse] = await Promise.all([
      client.request(collectionsQuery),
      client.request(productsQuery)
    ]);

    const collections = collectionsResponse.data.collections.edges.map(edge => edge.node);
    const products = productsResponse.data.products.edges.map(edge => edge.node);

    console.log(`📚 Found ${collections.length} collections`);
    console.log(`📦 Found ${products.length} published products\n`);

    // Show collections
    console.log('Collections:');
    collections.forEach(col => {
      console.log(`  - ${col.title} (${col.handle})`);
    });

    // Show sample products with tags
    console.log('\nSample products with tags:');
    products.slice(0, 5).forEach(prod => {
      console.log(`  - ${prod.title}: [${prod.tags.join(', ')}]`);
    });

    return { collections, products };
  } catch (error) {
    console.error('❌ Error getting data:', error.message);
    return { collections: [], products: [] };
  }
}

async function assignProductToCollection(productId, collectionId, productTitle, collectionTitle) {
  console.log(`🔗 Assigning "${productTitle}" → "${collectionTitle}"`);

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

  try {
    const response = await client.request(mutation, { variables });

    if (!response.data || !response.data.collectionAddProducts) {
      console.error(`❌ Invalid response for assignment`);
      return false;
    }

    const { collectionAddProducts } = response.data;

    if (collectionAddProducts.userErrors.length > 0) {
      console.error(`❌ Error:`, collectionAddProducts.userErrors[0].message);
      return false;
    }

    console.log(`✅ Success!`);
    return true;

  } catch (error) {
    console.error(`❌ Failed:`, error.message);
    return false;
  }
}

function determineCollections(product, collections) {
  const assignments = [];
  const productTags = product.tags || [];
  const productHandle = product.handle;

  // Create collection lookup
  const collectionMap = {};
  collections.forEach(col => {
    collectionMap[col.handle] = col;
  });

  // Functional Pottery - mugs, bowls, plates, food-safe items
  if (productTags.includes('functional-pottery') || 
      productTags.includes('food-safe') ||
      productTags.includes('mug') ||
      productTags.includes('bowl') ||
      productTags.includes('plate') ||
      productHandle.includes('mug') ||
      productHandle.includes('bowl') ||
      productHandle.includes('plate')) {
    
    const functionalCol = collectionMap['functional-pottery'];
    if (functionalCol) {
      assignments.push({
        productId: product.id,
        collectionId: functionalCol.id,
        productTitle: product.title,
        collectionTitle: functionalCol.title,
        reason: 'Functional pottery item'
      });
    }
  }

  // Decorative Pieces - vases, planters, decorative items
  if (productTags.includes('decorative') || 
      productTags.includes('vase') || 
      productTags.includes('planter') ||
      productHandle.includes('vase') ||
      productHandle.includes('planter') ||
      productHandle.includes('decorative')) {
    
    const decorativeCol = collectionMap['decorative-pieces'];
    if (decorativeCol) {
      assignments.push({
        productId: product.id,
        collectionId: decorativeCol.id,
        productTitle: product.title,
        collectionTitle: decorativeCol.title,
        reason: 'Decorative piece'
      });
    }
  }

  // Sets & Bundles - sets, bundles, gift items
  if (productTags.includes('set') || 
      productTags.includes('gift-ready') ||
      productHandle.includes('set') ||
      productHandle.includes('bundle') ||
      product.title.toLowerCase().includes('set')) {
    
    const setsCol = collectionMap['sets-bundles'];
    if (setsCol) {
      assignments.push({
        productId: product.id,
        collectionId: setsCol.id,
        productTitle: product.title,
        collectionTitle: setsCol.title,
        reason: 'Set or bundle item'
      });
    }
  }

  // Seconds - discounted items with imperfections
  if (productTags.includes('seconds') || 
      productHandle.includes('seconds') ||
      product.title.toLowerCase().includes('seconds')) {
    
    const secondsCol = collectionMap['seconds'];
    if (secondsCol) {
      assignments.push({
        productId: product.id,
        collectionId: secondsCol.id,
        productTitle: product.title,
        collectionTitle: secondsCol.title,
        reason: 'Seconds item'
      });
    }
  }

  return assignments;
}

async function main() {
  console.log('🚀 FIXING COLLECTION ASSIGNMENTS');
  console.log('=================================\n');

  const { collections, products } = await getCollectionsAndProducts();

  if (collections.length === 0 || products.length === 0) {
    console.error('❌ Could not get collections or products');
    return;
  }

  // Generate all assignments
  let allAssignments = [];
  products.forEach(product => {
    // Skip test products
    if (product.title.includes('Test')) return;
    
    const assignments = determineCollections(product, collections);
    allAssignments = allAssignments.concat(assignments);
  });

  console.log(`\n🔗 Planning ${allAssignments.length} assignments:\n`);

  // Show first few assignments
  allAssignments.slice(0, 10).forEach(assignment => {
    console.log(`📎 "${assignment.productTitle}" → "${assignment.collectionTitle}" (${assignment.reason})`);
  });

  if (allAssignments.length > 10) {
    console.log(`   ... and ${allAssignments.length - 10} more\n`);
  }

  console.log(`🚀 Executing assignments...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const assignment of allAssignments) {
    const success = await assignProductToCollection(
      assignment.productId,
      assignment.collectionId,
      assignment.productTitle,
      assignment.collectionTitle
    );
    
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Stop after a reasonable number to avoid hitting limits
    if (successCount + errorCount >= 20) {
      console.log('\n⏸️  Stopping after 20 attempts to avoid rate limits');
      break;
    }
  }

  console.log(`\n📊 ASSIGNMENT RESULTS:`);
  console.log(`======================`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);

  console.log(`\n🧪 TEST THESE COLLECTION URLS NOW:`);
  console.log(`==================================`);
  console.log(`1. https://burnroadceramics.com/collections/functional-pottery`);
  console.log(`2. https://burnroadceramics.com/collections/decorative-pieces`);
  console.log(`3. https://burnroadceramics.com/collections/sets-bundles`);
  console.log(`4. https://burnroadceramics.com/collections/seconds`);
  
  console.log(`\n⏰ Wait 30 seconds, then test the URLs above.`);
}

main().catch(console.error);