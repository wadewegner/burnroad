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

async function getCollectionPreviewUrls() {
  console.log('🔍 Getting collection preview URLs...\n');

  const query = `
    query {
      collections(first: 10) {
        edges {
          node {
            id
            title
            handle
            onlineStorePreviewUrl
            onlineStoreUrl
          }
        }
      }
    }
  `;

  try {
    const response = await client.request(query);
    const collections = response.data.collections.edges.map(edge => edge.node);
    
    console.log(`📚 Collection URLs:\n`);
    
    collections.forEach(collection => {
      if (collection.title.includes('Test')) return;
      
      console.log(`🏷️  ${collection.title} (${collection.handle})`);
      console.log(`   Live URL: ${collection.onlineStoreUrl || 'NOT SET'}`);
      console.log(`   Preview URL: ${collection.onlineStorePreviewUrl || 'NOT SET'}`);
      console.log(`   Expected URL: https://burnroadceramics.com/collections/${collection.handle}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.graphQLErrors) {
      console.error('GraphQL errors:', JSON.stringify(error.graphQLErrors, null, 2));
    }
  }
}

async function checkThemes() {
  console.log('🎨 Checking themes...\n');

  const query = `
    query {
      themes(first: 10) {
        edges {
          node {
            id
            name
            role
            createdAt
            updatedAt
          }
        }
      }
    }
  `;

  try {
    const response = await client.request(query);
    const themes = response.data.themes.edges.map(edge => edge.node);
    
    console.log(`🎨 Found ${themes.length} themes:\n`);
    
    themes.forEach(theme => {
      console.log(`${theme.role === 'MAIN' ? '🟢' : '⚪'} ${theme.name} (${theme.role})`);
      console.log(`   ID: ${theme.id}`);
      console.log(`   Created: ${theme.createdAt}`);
      console.log(`   Updated: ${theme.updatedAt}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error getting themes:', error.message);
  }
}

async function main() {
  console.log('🚀 COLLECTION PREVIEW & THEME DEBUG');
  console.log('===================================\n');
  
  await getCollectionPreviewUrls();
  await checkThemes();
  
  console.log('🎯 DIAGNOSTIC SUMMARY:');
  console.log('======================');
  console.log('1. Check if collections have "Live URL" set');
  console.log('2. Try the Preview URLs to see if collections work in preview');
  console.log('3. Verify the MAIN theme is the correct one');
  console.log('4. Check if theme has collection.liquid template');
  
  console.log('\n💡 POSSIBLE CAUSES:');
  console.log('===================');
  console.log('1. Collections not published to Online Store channel');
  console.log('2. Theme missing collection.liquid template');
  console.log('3. URL routing issues with theme');
  console.log('4. Theme not properly assigned as MAIN theme');
}

main().catch(console.error);