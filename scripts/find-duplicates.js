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

async function getAllProducts() {
  console.log('🔍 Getting all products...\n');

  let allProducts = [];
  let hasNextPage = true;
  let cursor = null;

  while (hasNextPage) {
    const query = `
      query($cursor: String) {
        products(first: 50, after: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              title
              handle
              status
              createdAt
              updatedAt
              publishedAt
              totalInventory
              collections(first: 5) {
                edges {
                  node {
                    id
                    title
                  }
                }
              }
            }
          }
        }
      }
    `;

    try {
      const variables = cursor ? { cursor } : {};
      const response = await client.request(query, { variables });
      
      if (response && response.data && response.data.products) {
        const products = response.data.products.edges.map(edge => edge.node);
        allProducts = allProducts.concat(products);
        
        hasNextPage = response.data.products.pageInfo.hasNextPage;
        cursor = response.data.products.pageInfo.endCursor;
        
        console.log(`📦 Retrieved ${products.length} products (total: ${allProducts.length})`);
      } else {
        console.error('❌ Unexpected response structure');
        break;
      }
    } catch (error) {
      console.error('❌ Failed to get products:', error.message);
      break;
    }
  }

  console.log(`\n✅ Total products retrieved: ${allProducts.length}\n`);
  return allProducts;
}

async function analyzeForDuplicates() {
  const products = await getAllProducts();
  
  if (products.length === 0) {
    console.log('No products found to analyze.');
    return;
  }

  // Group products by title to find duplicates
  const productsByTitle = {};
  const productsByHandle = {};
  
  products.forEach(product => {
    // Group by title
    const title = product.title.toLowerCase().trim();
    if (!productsByTitle[title]) {
      productsByTitle[title] = [];
    }
    productsByTitle[title].push(product);
    
    // Group by handle
    if (!productsByHandle[product.handle]) {
      productsByHandle[product.handle] = [];
    }
    productsByHandle[product.handle].push(product);
  });

  // Find duplicates by title
  const duplicatesByTitle = Object.entries(productsByTitle)
    .filter(([title, products]) => products.length > 1);

  // Find duplicates by handle
  const duplicatesByHandle = Object.entries(productsByHandle)
    .filter(([handle, products]) => products.length > 1);

  console.log('🔍 DUPLICATE ANALYSIS RESULTS');
  console.log('==============================\n');

  // Analyze by title
  if (duplicatesByTitle.length > 0) {
    console.log(`📋 Found ${duplicatesByTitle.length} sets of products with duplicate titles:\n`);
    
    duplicatesByTitle.forEach(([title, duplicates]) => {
      console.log(`🔄 "${duplicates[0].title}" (${duplicates.length} copies):`);
      
      duplicates.forEach((product, index) => {
        const collectionCount = product.collections.edges.length;
        const createdDate = new Date(product.createdAt).toLocaleDateString();
        const isPublished = !!product.publishedAt;
        
        console.log(`   ${index + 1}. ID: ${product.id}`);
        console.log(`      Handle: ${product.handle}`);
        console.log(`      Status: ${product.status}`);
        console.log(`      Created: ${createdDate}`);
        console.log(`      Published: ${isPublished ? '✅' : '❌'}`);
        console.log(`      Collections: ${collectionCount}`);
        console.log(`      Inventory: ${product.totalInventory || 0}`);
        
        if (collectionCount > 0) {
          product.collections.edges.forEach(coll => {
            console.log(`        - ${coll.node.title}`);
          });
        }
        console.log('');
      });
      
      // Recommend which to keep vs remove
      const scored = duplicates.map(product => {
        let score = 0;
        
        // Active status gets high score
        if (product.status === 'ACTIVE') score += 100;
        
        // Published gets high score
        if (product.publishedAt) score += 50;
        
        // Having collections gets score
        score += product.collections.edges.length * 20;
        
        // Having inventory gets score
        score += (product.totalInventory || 0) * 10;
        
        // Newer products get slight bonus
        const daysSinceCreated = (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        score += Math.max(0, 30 - daysSinceCreated);
        
        return { product, score };
      });
      
      // Sort by score (highest first)
      scored.sort((a, b) => b.score - a.score);
      
      console.log(`📊 RECOMMENDATION FOR "${duplicates[0].title}":`);
      console.log(`   ✅ KEEP: ${scored[0].product.handle} (Score: ${scored[0].score.toFixed(1)})`);
      
      scored.slice(1).forEach(candidate => {
        console.log(`   ❌ REMOVE: ${candidate.product.handle} (Score: ${candidate.score.toFixed(1)})`);
        console.log(`      ID: ${candidate.product.id}`);
      });
      
      console.log('\n' + '='.repeat(60) + '\n');
    });
  } else {
    console.log('✅ No duplicate titles found.\n');
  }

  // Summary
  const removalCandidates = [];
  duplicatesByTitle.forEach(([title, duplicates]) => {
    const scored = duplicates.map(product => {
      let score = 0;
      if (product.status === 'ACTIVE') score += 100;
      if (product.publishedAt) score += 50;
      score += product.collections.edges.length * 20;
      score += (product.totalInventory || 0) * 10;
      const daysSinceCreated = (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 30 - daysSinceCreated);
      return { product, score };
    });
    
    scored.sort((a, b) => b.score - a.score);
    scored.slice(1).forEach(candidate => {
      removalCandidates.push(candidate.product);
    });
  });

  console.log(`📋 SUMMARY:`);
  console.log(`   Total products: ${products.length}`);
  console.log(`   Duplicate sets: ${duplicatesByTitle.length}`);
  console.log(`   Products to remove: ${removalCandidates.length}\n`);
  
  if (removalCandidates.length > 0) {
    console.log('🔧 To remove duplicates, run: node remove-duplicates.js');
    
    // Save removal candidates to a file for the removal script
    const fs = require('fs');
    const removalData = {
      timestamp: new Date().toISOString(),
      candidates: removalCandidates.map(p => ({
        id: p.id,
        title: p.title,
        handle: p.handle,
        status: p.status
      }))
    };
    
    fs.writeFileSync('./duplicate-removal-list.json', JSON.stringify(removalData, null, 2));
    console.log('💾 Removal list saved to: duplicate-removal-list.json');
  }

  return removalCandidates;
}

async function main() {
  console.log('🔍 PRODUCT DUPLICATE FINDER');
  console.log('============================\n');
  
  await analyzeForDuplicates();
}

// Export for use in other scripts
module.exports = { analyzeForDuplicates, getAllProducts };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}