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

// Navigation menu structure for pottery store
const navigationMenus = [
  {
    handle: 'main-menu',
    title: 'Main Menu',
    items: [
      {
        title: 'Shop',
        url: '/collections/all',
        items: [
          {
            title: "This Month's Kiln Load",
            url: '/collections/this-months-kiln-load'
          },
          {
            title: 'Functional Pottery',
            url: '/collections/functional-pottery'
          },
          {
            title: 'Decorative Pieces',
            url: '/collections/decorative-pieces'
          },
          {
            title: 'Sets & Bundles',
            url: '/collections/sets-bundles'
          },
          {
            title: 'Seconds',
            url: '/collections/seconds'
          }
        ]
      },
      {
        title: 'About',
        url: '/pages/about'
      },
      {
        title: 'Custom Orders',
        url: '/pages/custom-orders'
      },
      {
        title: 'Contact',
        url: '/pages/contact'
      }
    ]
  },
  {
    handle: 'footer-menu',
    title: 'Footer Menu',
    items: [
      {
        title: 'FAQ',
        url: '/pages/faq'
      },
      {
        title: 'Shipping & Returns',
        url: '/pages/shipping-returns'
      },
      {
        title: 'Care Instructions',
        url: '/pages/care-instructions'
      },
      {
        title: 'Privacy Policy',
        url: '/policies/privacy-policy'
      },
      {
        title: 'Terms of Service',
        url: '/policies/terms-of-service'
      }
    ]
  }
];

async function createNavigationMenu(menu) {
  const mutation = `
    mutation menuCreate($title: String!, $handle: String!, $items: [MenuItemCreateInput!]!) {
      menuCreate(title: $title, handle: $handle, items: $items) {
        menu {
          id
          handle
          title
          items {
            id
            title
            url
            items {
              id
              title
              url
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    title: menu.title,
    handle: menu.handle,
    items: menu.items.map(item => ({
      title: item.title,
      url: item.url,
      type: "HTTP",
      items: item.items ? item.items.map(subItem => ({
        title: subItem.title,
        url: subItem.url,
        type: "HTTP"
      })) : []
    }))
  };

  if (config.dryRun) {
    console.log(`🔍 DRY RUN: Would create navigation menu "${menu.title}"`);
    return { success: true, data: menu };
  }

  try {
    const response = await client.request(mutation, { variables });

    if (!response || !response.data || !response.data.menuCreate) {
      console.error(`❌ Unexpected response structure for menu "${menu.title}"`);
      
      // Check if this response contains GraphQL errors
      if (response && response.errors && response.errors.graphQLErrors) {
        console.error(`🔍 GraphQL errors:`, JSON.stringify(response.errors.graphQLErrors, null, 2));
        return { success: false, errors: response.errors.graphQLErrors };
      }
      
      return { success: false, error: 'Unexpected response structure' };
    }

    const { menuCreate } = response.data;

    if (menuCreate.userErrors.length > 0) {
      console.error(`❌ Error creating menu "${menu.title}":`, menuCreate.userErrors);
      return { success: false, errors: menuCreate.userErrors };
    }

    const createdMenu = menuCreate.menu;
    console.log(`✅ Created navigation menu: "${menu.title}" with ${createdMenu.items.length} items`);

    return { success: true, data: createdMenu };

  } catch (error) {
    console.error(`❌ Failed to create menu "${menu.title}":`, error.message);
    
    if (error.errors && error.errors.graphQLErrors) {
      console.error(`🔍 GraphQL errors:`, JSON.stringify(error.errors.graphQLErrors, null, 2));
    }
    
    return { success: false, error: error.message };
  }
}

async function createAllNavigationMenus() {
  console.log('🧭 Creating Navigation Menus...\n');

  if (config.dryRun) {
    console.log('🔍 DRY RUN MODE: No actual changes will be made\n');
  }

  const results = [];

  for (const menu of navigationMenus) {
    const result = await createNavigationMenu(menu);
    results.push(result);

    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n📊 Navigation Menu Creation Summary:');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`✅ Successfully created: ${successful} navigation menus`);
  if (failed > 0) {
    console.log(`❌ Failed to create: ${failed} navigation menus`);
  }

  console.log('\n🎉 Navigation menu creation complete!');

  if (!config.dryRun) {
    console.log('\n📋 Next steps:');
    console.log('1. Go to Online Store → Navigation in Shopify admin');
    console.log('2. Assign menus to header and footer locations');
    console.log('3. Test navigation on your storefront');
    console.log('4. Adjust menu order if needed');
  }
}

// Export the function for use in other scripts
module.exports = { createAllNavigationMenus };

// Run the script if called directly
if (require.main === module) {
  createAllNavigationMenus().catch(console.error);
}