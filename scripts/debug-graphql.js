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

async function debugCollectionCreation() {
  console.log('🔍 Testing Collection Creation...\n');
  
  const mutation = `
    mutation collectionCreate($input: CollectionInput!) {
      collectionCreate(input: $input) {
        collection {
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

  const variables = {
    input: {
      title: "Test Collection",
      handle: "test-collection",
      descriptionHtml: "Test collection description",
      sortOrder: "MANUAL"
    }
  };

  console.log('Variables being sent:', JSON.stringify(variables, null, 2));
  
  try {
    const response = await client.request(mutation, { variables });
    console.log('✅ Collection creation response structure:', JSON.stringify(response, null, 2));
    if (response.data && response.data.collectionCreate) {
      console.log('✅ Collection created successfully:', response.data.collectionCreate.collection);
    }
  } catch (error) {
    console.error('❌ Collection creation error:', JSON.stringify(error.errors?.graphQLErrors, null, 2));
  }
}

async function debugProductCreation() {
  console.log('\n🔍 Testing Product Creation...\n');
  
  const mutation = `
    mutation productCreate($input: ProductInput!) {
      productCreate(input: $input) {
        product {
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

  const variables = {
    input: {
      title: "Test Product",
      handle: "test-product",
      vendor: "Test Vendor",
      productType: "Test Type",
      tags: ["test"],
      status: "ACTIVE",
      options: ["Title"]
    }
  };

  try {
    const response = await client.request(mutation, { variables });
    console.log('✅ Product creation response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('❌ Product creation error:', error);
    console.error('📋 Error details:', {
      message: error.message,
      graphQLErrors: error.graphQLErrors,
      networkStatusCode: error.networkStatusCode
    });
  }
}

async function debugMenuCreation() {
  console.log('\n🔍 Testing Menu Creation...\n');
  
  // Use the correct MenuItemCreateInput type
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
    title: "Test Menu",
    handle: "test-menu", 
    items: [
      {
        title: "Shop",
        url: "/collections/all",
        type: "HTTP"
      },
      {
        title: "About", 
        url: "/pages/about",
        type: "HTTP"
      }
    ]
  };

  try {
    const response = await client.request(mutation, { variables });
    console.log('✅ Menu creation response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('❌ Menu creation error:', JSON.stringify(error.errors?.graphQLErrors, null, 2));
  }
}

async function debugVariantCreation() {
  console.log('\n🔍 Testing Product Variant Creation...\n');
  
  const mutation = `
    mutation productVariantsBulkCreate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkCreate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    productId: "gid://shopify/Product/123", // Test with a fake ID first
    variants: [
      {
        price: "32.00",
        taxable: true
      }
    ]
  };

  try {
    const response = await client.request(mutation, { variables });
    console.log('✅ Variant creation response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('❌ Variant creation error:', JSON.stringify(error.errors?.graphQLErrors, null, 2));
  }
}

async function runDebug() {
  console.log('🐛 GRAPHQL DEBUG SESSION');
  console.log('========================\n');
  
  await debugVariantCreation();
  
  console.log('\n🎉 Debug session complete!');
}

runDebug().catch(console.error); 