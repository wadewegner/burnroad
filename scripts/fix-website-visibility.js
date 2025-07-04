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

async function updateProductForOnlineStore(productId, productTitle) {
  console.log(`🔄 Updating "${productTitle}" for online store...`);
  
  const mutation = `
    mutation productUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product {
          id
          title
          status
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
      id: productId,
      status: "ACTIVE"
    }
  };

  try {
    const response = await client.request(mutation, { variables });
    
    if (response.data && response.data.productUpdate) {
      const { productUpdate } = response.data;
      
      if (productUpdate.userErrors.length > 0) {
        console.error(`❌ Error updating product:`, productUpdate.userErrors);
        return false;
      }
      
      console.log(`✅ Updated "${productTitle}"`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Failed to update "${productTitle}":`, error.message);
    return false;
  }
}

async function createStorePages() {
  console.log('\\n📄 Creating basic store pages...\\n');
  
  // Create a basic "Shop" page that lists all products
  const mutation = `
    mutation pageCreate($page: PageInput!) {
      pageCreate(page: $page) {
        page {
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

  const pages = [
    {
      title: "Shop",
      handle: "shop",
      body: `<h1>Shop Our Pottery Collection</h1>
      <p>Browse our beautiful handmade pottery pieces.</p>
      <div class="collection-list">
        <a href="/collections/functional-pottery">Functional Pottery</a> |
        <a href="/collections/decorative-pieces">Decorative Pieces</a> |
        <a href="/collections/sets-bundles">Sets & Bundles</a> |
        <a href="/collections/seconds">Seconds</a>
      </div>`
    },
    {
      title: "About",
      handle: "about", 
      body: `<h1>About Burn Road Ceramics</h1>
      <p>Welcome to Burn Road Ceramics, where we create beautiful, functional pottery pieces by hand in our Lake Stevens studio.</p>`
    }
  ];

  for (const page of pages) {
    const variables = {
      page: {
        title: page.title,
        handle: page.handle,
        bodyHtml: page.body
      }
    };

    try {
      const response = await client.request(mutation, { variables });
      
      if (response.data && response.data.pageCreate) {
        const { pageCreate } = response.data;
        
        if (pageCreate.userErrors.length > 0) {
          // Check if page already exists
          if (pageCreate.userErrors.some(error => error.message.includes('Handle has already been taken'))) {
            console.log(`✅ Page "${page.title}" already exists`);
          } else {
            console.error(`❌ Error creating page "${page.title}":`, pageCreate.userErrors);
          }
        } else {
          console.log(`✅ Created page: "${page.title}"`);
        }
      }
    } catch (error) {
      console.error(`❌ Failed to create page "${page.title}":`, error.message);
    }
  }
}

async function main() {
  console.log('🚀 FIXING WEBSITE VISIBILITY');
  console.log('============================\\n');
  
  // Step 1: Get all products and update them to ensure they're active
  console.log('📦 Ensuring all products are active...\\n');
  
  const query = `
    query {
      products(first: 50) {
        edges {
          node {
            id
            title
            handle
            status
          }
        }
      }
    }
  `;

  try {
    const response = await client.request(query);
    const products = response.data.products.edges.map(edge => edge.node);
    
    console.log(`Found ${products.length} products\\n`);
    
    for (const product of products) {
      if (product.title.includes('Test Product')) continue; // Skip test products
      
      await updateProductForOnlineStore(product.id, product.title);
      await new Promise(resolve => setTimeout(resolve, 200)); // Rate limiting
    }
    
    // Step 2: Create basic pages
    await createStorePages();
    
    // Step 3: Instructions for manual steps
    console.log('\\n🎯 MANUAL STEPS NEEDED:');
    console.log('======================\\n');
    console.log('1. Go to your Shopify admin: https://ixufhm-yj.myshopify.com/admin');
    console.log('\\n2. Check Theme Settings:');
    console.log('   - Online Store → Themes → Customize');
    console.log('   - Ensure "Featured Collection" sections point to your collections');
    console.log('\\n3. Assign Navigation Menus:');
    console.log('   - Online Store → Navigation');
    console.log('   - Assign "Main Menu" to Header');
    console.log('   - Assign "Footer Menu" to Footer');
    console.log('\\n4. Add Collection Pages to Menu:');
    console.log('   - Make sure menu items link to /collections/functional-pottery etc.');
    console.log('\\n5. Check Sales Channels:');
    console.log('   - Settings → Apps and sales channels');
    console.log('   - Ensure "Online Store" is active');
    console.log('\\n6. Theme Requirements:');
    console.log('   - Your theme must support collections and products');
    console.log('   - Check if theme has collection page templates');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\\n✅ Updates complete! Check manual steps above.');
}

main().catch(console.error);