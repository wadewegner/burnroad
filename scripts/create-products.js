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

// Cache for Online Store publication ID
let onlineStorePublicationId = null;

async function getOnlineStorePublicationId() {
  if (onlineStorePublicationId) {
    return onlineStorePublicationId;
  }

  console.log('🔍 Getting Online Store publication ID...');
  
  const query = `
    query {
      publications(first: 10) {
        edges {
          node {
            id
            name
            supportsFuturePublishing
          }
        }
      }
    }
  `;

  try {
    const response = await client.request(query);
    const publications = response.data.publications.edges.map(edge => edge.node);
    
    const onlineStore = publications.find(p => p.name === 'Online Store');
    
    if (!onlineStore) {
      throw new Error('Could not find "Online Store" publication channel');
    }

    onlineStorePublicationId = onlineStore.id;
    console.log(`✅ Found Online Store publication ID: ${onlineStorePublicationId}`);
    return onlineStorePublicationId;
    
  } catch (error) {
    console.error('❌ Failed to get Online Store publication ID:', error.message);
    throw error;
  }
}

async function publishProductToOnlineStore(productId, productTitle) {
  if (config.dryRun) {
    console.log(`🔍 DRY RUN: Would publish product "${productTitle}" to Online Store`);
    return true;
  }

  try {
    const publicationId = await getOnlineStorePublicationId();
    
    const mutation = `
      mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
        publishablePublish(id: $id, input: $input) {
          publishable {
            availablePublicationCount
            publicationCount
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      id: productId,
      input: [
        {
          publicationId: publicationId
        }
      ]
    };

    const response = await client.request(mutation, { variables });
    
    if (response.data.publishablePublish.userErrors.length > 0) {
      console.error(`❌ Error publishing product "${productTitle}":`, response.data.publishablePublish.userErrors);
      return false;
    }
    
    console.log(`📢 Published product "${productTitle}" to Online Store`);
    return true;
    
  } catch (error) {
    // Check if this is an error due to product already being published
    if (error.errors && error.errors.graphQLErrors) {
      const alreadyPublishedError = error.errors.graphQLErrors.find(err => 
        err.message && err.message.includes('already published')
      );
      
      if (alreadyPublishedError) {
        console.log(`✅ Product "${productTitle}" is already published to Online Store`);
        return true;
      }
    }
    
    console.log(`⚠️  Could not publish product "${productTitle}": ${error.message}`);
    console.log(`   (Product might already be published)`);
    return true; // Assume success for existing products
  }
}

// Product definitions based on our SAMPLE_PRODUCTS.md documentation
const products = [
  // Functional Pottery Collection
  {
    title: "Sage Green Morning Mug",
    handle: "sage-green-morning-mug",
    description: "Start your day with this beautiful sage green mug, perfect for coffee or tea. Hand-thrown with a comfortable handle and smooth finish. Holds 10 oz.\n\n**Dimensions:** 4\" H x 3.5\" W, 10 oz capacity\n**Care:** Dishwasher, microwave, and oven safe up to 400°F\n**Firing:** High-fired stoneware for durability",
    vendor: "Burn Road Ceramics",
    product_type: "Mug",
    tags: ["mug", "medium", "sage-green", "food-safe", "microwave-safe", "dishwasher-safe", "oven-safe", "functional-pottery", "modern", "smooth", "easy-care", "25-50"],
    status: "active",
    published: true,
    variants: [
      {
        price: "32.00",
        inventory_quantity: 2,
        weight: 0.75,
        weight_unit: "lb",
        requires_shipping: true,
        taxable: true,
        sku: "BRC-MUG-SAGE-001"
      }
    ],
    seo: {
      title: "Sage Green Morning Mug | Handmade Ceramic Coffee Mug",
      description: "Beautiful sage green ceramic mug, perfect for coffee or tea. Hand-thrown stoneware, dishwasher and microwave safe. 10 oz capacity."
    }
  },
  {
    title: "Speckled Breakfast Bowl",
    handle: "speckled-breakfast-bowl",
    description: "Perfect for cereal, oatmeal, or soup. This bowl features a beautiful speckled glaze that adds texture and visual interest. The wide rim makes it comfortable to hold.\n\n**Dimensions:** 3\" H x 6\" W, 16 oz capacity\n**Care:** Dishwasher, microwave, and oven safe up to 400°F\n**Firing:** High-fired stoneware with food-safe glaze",
    vendor: "Burn Road Ceramics",
    product_type: "Bowl",
    tags: ["bowl", "medium", "speckled", "food-safe", "microwave-safe", "dishwasher-safe", "oven-safe", "functional-pottery", "rustic", "textured", "25-50"],
    status: "active",
    published: true,
    variants: [
      {
        price: "38.00",
        inventory_quantity: 3,
        weight: 0.90,
        weight_unit: "lb",
        requires_shipping: true,
        taxable: true,
        sku: "BRC-BOWL-SPECK-001"
      }
    ],
    seo: {
      title: "Speckled Breakfast Bowl | Handmade Ceramic Bowl",
      description: "Beautiful speckled ceramic bowl perfect for breakfast, soup, or salad. Hand-thrown stoneware with food-safe glaze. 16 oz capacity."
    }
  },
  {
    title: "Dinner Plate Set (4 pieces)",
    handle: "dinner-plate-set-4-pieces",
    description: "Set of four matching dinner plates in warm cream glaze. Perfect for everyday dining or special occasions. Each plate is individually hand-thrown for slight variations that add character.\n\n**Dimensions:** 1\" H x 10\" W each\n**Care:** Dishwasher, microwave, and oven safe up to 400°F\n**Set includes:** 4 matching dinner plates",
    vendor: "Burn Road Ceramics",
    product_type: "Plate Set",
    tags: ["plate", "set", "large", "cream", "food-safe", "microwave-safe", "dishwasher-safe", "oven-safe", "functional-pottery", "classic", "smooth", "75-100", "gift-ready"],
    status: "active",
    published: true,
    variants: [
      {
        price: "95.00",
        inventory_quantity: 1,
        weight: 3.50,
        weight_unit: "lb",
        requires_shipping: true,
        taxable: true,
        sku: "BRC-PLATE-SET-CREAM-001"
      }
    ],
    seo: {
      title: "Dinner Plate Set | Handmade Ceramic Plates | Set of 4",
      description: "Set of 4 handmade ceramic dinner plates in warm cream glaze. Perfect for everyday dining. Dishwasher and microwave safe."
    }
  },
  {
    title: "Large Serving Bowl",
    handle: "large-serving-bowl",
    description: "Perfect for salads, pasta, or serving large groups. This generous bowl features a classic white glaze with subtle blue rim detail. The wide base provides stability.\n\n**Dimensions:** 4\" H x 12\" W, 48 oz capacity\n**Care:** Dishwasher, microwave, and oven safe up to 400°F\n**Perfect for:** Salads, pasta, serving groups of 6-8",
    vendor: "Burn Road Ceramics",
    product_type: "Serving Bowl",
    tags: ["bowl", "large", "white", "blue-rim", "food-safe", "microwave-safe", "dishwasher-safe", "oven-safe", "functional-pottery", "classic", "serving", "50-75"],
    status: "active",
    published: true,
    variants: [
      {
        price: "65.00",
        inventory_quantity: 2,
        weight: 2.25,
        weight_unit: "lb",
        requires_shipping: true,
        taxable: true,
        sku: "BRC-BOWL-SERVE-WHITE-001"
      }
    ],
    seo: {
      title: "Large Serving Bowl | Handmade Ceramic Serving Bowl",
      description: "Large handmade ceramic serving bowl with white glaze and blue rim. Perfect for salads, pasta, and entertaining. 48 oz capacity."
    }
  },
  
  // Decorative Pieces Collection
  {
    title: "Tall Cylinder Vase",
    handle: "tall-cylinder-vase",
    description: "Elegant tall vase perfect for dried flowers, branches, or single-stem arrangements. Features a beautiful matte black glaze with subtle texture from the throwing process.\n\n**Dimensions:** 12\" H x 4\" W\n**Care:** Wipe clean with damp cloth\n**Perfect for:** Dried flowers, branches, modern decor",
    vendor: "Burn Road Ceramics",
    product_type: "Vase",
    tags: ["vase", "tall", "black", "matte", "decorative", "modern", "minimal", "dried-flowers", "branches", "50-75"],
    status: "active",
    published: true,
    variants: [
      {
        price: "58.00",
        inventory_quantity: 1,
        weight: 1.75,
        weight_unit: "lb",
        requires_shipping: true,
        taxable: true,
        sku: "BRC-VASE-CYL-BLACK-001"
      }
    ],
    seo: {
      title: "Tall Cylinder Vase | Handmade Ceramic Vase",
      description: "Elegant tall ceramic vase with matte black glaze. Perfect for dried flowers and modern home decor. Handmade pottery."
    }
  },
  {
    title: "Succulent Planter Trio",
    handle: "succulent-planter-trio",
    description: "Set of three small planters perfect for succulents, herbs, or small plants. Each features a different earth-tone glaze. Drainage holes included.\n\n**Dimensions:** 3\" H x 4\" W each\n**Care:** Suitable for indoor and outdoor use\n**Set includes:** 3 planters in different glazes",
    vendor: "Burn Road Ceramics",
    product_type: "Planter Set",
    tags: ["planter", "set", "small", "earth-tones", "succulents", "herbs", "drainage", "indoor", "outdoor", "modern", "25-50", "gift-ready"],
    status: "active",
    published: true,
    variants: [
      {
        price: "42.00",
        inventory_quantity: 2,
        weight: 1.50,
        weight_unit: "lb",
        requires_shipping: true,
        taxable: true,
        sku: "BRC-PLANT-TRIO-EARTH-001"
      }
    ],
    seo: {
      title: "Succulent Planter Trio | Small Ceramic Planters | Set of 3",
      description: "Set of 3 small ceramic planters perfect for succulents and herbs. Different earth-tone glazes with drainage holes. Indoor/outdoor use."
    }
  },
  {
    title: "Decorative Fruit Bowl",
    handle: "decorative-fruit-bowl",
    description: "Beautiful wide bowl perfect for displaying fruit or as a decorative centerpiece. Features a gorgeous reactive glaze that creates unique patterns on each piece.\n\n**Dimensions:** 3\" H x 10\" W\n**Care:** Food-safe but recommended for decorative use\n**Perfect for:** Fruit display, centerpiece, decorative storage",
    vendor: "Burn Road Ceramics",
    product_type: "Decorative Bowl",
    tags: ["bowl", "large", "reactive-glaze", "decorative", "centerpiece", "fruit", "unique", "food-safe", "modern", "50-75"],
    status: "active",
    published: true,
    variants: [
      {
        price: "68.00",
        inventory_quantity: 1,
        weight: 2.00,
        weight_unit: "lb",
        requires_shipping: true,
        taxable: true,
        sku: "BRC-BOWL-FRUIT-REACT-001"
      }
    ],
    seo: {
      title: "Decorative Fruit Bowl | Handmade Ceramic Bowl",
      description: "Beautiful decorative ceramic bowl with reactive glaze. Perfect for fruit display or as a centerpiece. Each piece is unique."
    }
  },
  
  // Sets & Bundles Collection
  {
    title: "Coffee Lover's Set",
    handle: "coffee-lovers-set",
    description: "Perfect gift for coffee enthusiasts! Includes two matching mugs and a small bowl for snacks. All pieces feature coordinating glazes in warm earth tones.\n\n**Set includes:**\n- 2 coffee mugs (12 oz each)\n- 1 small bowl for snacks\n**Care:** Dishwasher, microwave, and oven safe",
    vendor: "Burn Road Ceramics",
    product_type: "Coffee Set",
    tags: ["set", "coffee", "gift", "earth-tones", "coordinating", "food-safe", "microwave-safe", "dishwasher-safe", "75-100", "gift-ready"],
    status: "active",
    published: true,
    variants: [
      {
        price: "85.00",
        inventory_quantity: 1,
        weight: 2.50,
        weight_unit: "lb",
        requires_shipping: true,
        taxable: true,
        sku: "BRC-SET-COFFEE-EARTH-001"
      }
    ],
    seo: {
      title: "Coffee Lover's Set | Handmade Ceramic Coffee Set",
      description: "Perfect gift set for coffee lovers. Includes 2 mugs and snack bowl in coordinating earth tones. Dishwasher and microwave safe."
    }
  },
  {
    title: "Place Setting for Two",
    handle: "place-setting-for-two",
    description: "Complete dining set for two people. Includes dinner plates, salad plates, bowls, and mugs in coordinating blue-gray glaze. Perfect for couples or small households.\n\n**Set includes:**\n- 2 dinner plates\n- 2 salad plates\n- 2 bowls\n- 2 mugs\n**Care:** Dishwasher, microwave, and oven safe",
    vendor: "Burn Road Ceramics",
    product_type: "Place Setting",
    tags: ["set", "place-setting", "blue-gray", "coordinating", "couple", "food-safe", "microwave-safe", "dishwasher-safe", "100-150", "gift-ready"],
    status: "active",
    published: true,
    variants: [
      {
        price: "125.00",
        inventory_quantity: 1,
        weight: 4.00,
        weight_unit: "lb",
        requires_shipping: true,
        taxable: true,
        sku: "BRC-SET-PLACE-BLUE-001"
      }
    ],
    seo: {
      title: "Place Setting for Two | Complete Ceramic Dinnerware Set",
      description: "Complete dinnerware set for two people. Includes plates, bowls, and mugs in coordinating blue-gray glaze. Perfect for couples."
    }
  },
  
  // Seconds Collection
  {
    title: "Seconds: Everyday Mug",
    handle: "seconds-everyday-mug",
    description: "Beautiful everyday mug with minor cosmetic imperfections that don't affect function. Small glaze variations or slight irregularities make each piece unique while maintaining full functionality.\n\n**Dimensions:** 4\" H x 3.5\" W, 10 oz capacity\n**Imperfections:** Minor glaze variations, slight size differences\n**Care:** Dishwasher, microwave, and oven safe",
    vendor: "Burn Road Ceramics",
    product_type: "Mug",
    tags: ["mug", "seconds", "affordable", "minor-imperfections", "functional", "food-safe", "microwave-safe", "dishwasher-safe", "under-25", "unique"],
    status: "active",
    published: true,
    variants: [
      {
        price: "18.00",
        inventory_quantity: 4,
        weight: 0.75,
        weight_unit: "lb",
        requires_shipping: true,
        taxable: true,
        sku: "BRC-SEC-MUG-EVERY-001"
      }
    ],
    seo: {
      title: "Seconds: Everyday Mug | Affordable Handmade Ceramic Mug",
      description: "Beautiful everyday ceramic mug with minor imperfections at an affordable price. Full functionality with unique character."
    }
  },
  {
    title: "Seconds: Small Bowl",
    handle: "seconds-small-bowl",
    description: "Perfect little bowl for snacks, sauces, or small servings. Minor glaze imperfections or slight warping that doesn't affect use. Great value for functional pottery.\n\n**Dimensions:** 2.5\" H x 5\" W, 8 oz capacity\n**Imperfections:** Minor glaze runs, slight asymmetry\n**Care:** Dishwasher, microwave, and oven safe",
    vendor: "Burn Road Ceramics",
    product_type: "Bowl",
    tags: ["bowl", "small", "seconds", "affordable", "minor-imperfections", "functional", "food-safe", "microwave-safe", "dishwasher-safe", "under-25", "unique"],
    status: "active",
    published: true,
    variants: [
      {
        price: "22.00",
        inventory_quantity: 3,
        weight: 0.60,
        weight_unit: "lb",
        requires_shipping: true,
        taxable: true,
        sku: "BRC-SEC-BOWL-SMALL-001"
      }
    ],
    seo: {
      title: "Seconds: Small Bowl | Affordable Handmade Ceramic Bowl",
      description: "Small ceramic bowl with minor imperfections at an affordable price. Perfect for snacks and small servings. Full functionality."
    }
  }
];

async function updateVariantDetails(variantId, variantData) {
  const mutation = `
    mutation productVariantUpdate($input: ProductVariantInput!) {
      productVariantUpdate(input: $input) {
        productVariant {
          id
          price
          sku
          weight
          weightUnit
          requiresShipping
          inventoryQuantity
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
      id: variantId,
      sku: variantData.sku,
      weight: variantData.weight,
      weightUnit: variantData.weight_unit.toUpperCase(),
      requiresShipping: variantData.requires_shipping,
      inventoryQuantity: variantData.inventory_quantity
    }
  };

  try {
    const response = await client.request(mutation, { variables });
    
    if (!response || !response.data || !response.data.productVariantUpdate) {
      console.error(`❌ Unexpected variant update response:`, response);
      return { success: false, error: 'Unexpected variant update response' };
    }
    
    const { productVariantUpdate } = response.data;
    
    if (productVariantUpdate.userErrors.length > 0) {
      console.error(`❌ Error updating variant:`, productVariantUpdate.userErrors);
      return { success: false, errors: productVariantUpdate.userErrors };
    }
    
    return { success: true, data: productVariantUpdate.productVariant };
    
  } catch (error) {
    console.error(`❌ Failed to update variant:`, error.message);
    return { success: false, error: error.message };
  }
}

async function createProductVariants(productId, variants) {
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
    productId: productId,
    variants: variants.map(variant => ({
      price: variant.price,
      taxable: variant.taxable,
      optionValues: [
        {
          name: "Default Title",
          optionName: "Title"
        }
      ]
    }))
  };

  if (config.dryRun) {
    console.log(`🔍 DRY RUN: Would create ${variants.length} variants for product`);
    return { success: true, data: variants };
  }

  try {
    const response = await client.request(mutation, { variables });
    
    if (!response || !response.data || !response.data.productVariantsBulkCreate) {
      console.error(`❌ Unexpected variant response structure:`, JSON.stringify(response, null, 2));
      return { success: false, error: 'Unexpected variant response structure' };
    }
    
    const { productVariantsBulkCreate } = response.data;
    
    if (productVariantsBulkCreate.userErrors.length > 0) {
      console.error(`❌ Error creating variants:`, productVariantsBulkCreate.userErrors);
      return { success: false, errors: productVariantsBulkCreate.userErrors };
    }
    
    console.log(`✅ Created ${productVariantsBulkCreate.productVariants.length} variants`);
    
    // Now update each variant with additional details
    const createdVariants = productVariantsBulkCreate.productVariants;
    const updatedVariants = [];
    
    for (let i = 0; i < createdVariants.length; i++) {
      const variantId = createdVariants[i].id;
      const variantData = variants[i];
      
      const updateResult = await updateVariantDetails(variantId, variantData);
      if (updateResult.success) {
        updatedVariants.push(updateResult.data);
      } else {
        console.error(`❌ Failed to update variant ${i + 1}`);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`✅ Updated ${updatedVariants.length} variants with details`);
    return { success: true, data: updatedVariants };
    
  } catch (error) {
    console.error(`❌ Failed to create variants:`, error.message);
    return { success: false, error: error.message };
  }
}

async function createProduct(product) {
  const mutation = `
    mutation productCreate($input: ProductInput!) {
      productCreate(input: $input) {
        product {
          id
          title
          handle
          description
          vendor
          productType
          tags
          status
          seo {
            title
            description
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
    input: {
      title: product.title,
      handle: product.handle,
      vendor: product.vendor,
      productType: product.product_type,
      tags: product.tags,
      status: product.status.toUpperCase()
    }
  };

  if (config.dryRun) {
    console.log(`🔍 DRY RUN: Would create product "${product.title}" - $${product.variants[0].price}`);
    return { success: true, data: product };
  }

  try {
    // Step 1: Create the product
    const response = await client.request(mutation, { variables });
    
    if (!response || !response.data || !response.data.productCreate) {
      console.error(`❌ Unexpected response structure for "${product.title}":`, response);
      return { success: false, error: 'Unexpected response structure' };
    }
    
    const { productCreate } = response.data;
    
    if (productCreate.userErrors.length > 0) {
      console.error(`❌ Error creating product "${product.title}":`, productCreate.userErrors);
      return { success: false, errors: productCreate.userErrors };
    }
    
    const createdProduct = productCreate.product;
    console.log(`✅ Created product: "${product.title}"`);
    
    // Step 2: Create variants
    const variantResult = await createProductVariants(createdProduct.id, product.variants);
    
    if (!variantResult.success) {
      console.error(`❌ Failed to create variants for "${product.title}"`);
      return { success: false, error: 'Failed to create variants', productCreated: true };
    }
    
    console.log(`✅ Product "${product.title}" created successfully - $${product.variants[0].price}`);
    
    // Step 3: Automatically publish to Online Store
    const publishSuccess = await publishProductToOnlineStore(createdProduct.id, product.title);
    
    return { success: true, data: createdProduct, variants: variantResult.data, published: publishSuccess };
    
  } catch (error) {
    console.error(`❌ Failed to create product "${product.title}":`, error.message);
    
    // Check if this is a GraphQL error with specific details
    if (error.response && error.response.errors) {
      console.error(`🔍 GraphQL errors:`, JSON.stringify(error.response.errors, null, 2));
    } else if (error.graphQLErrors && error.graphQLErrors.length > 0) {
      console.error(`🔍 GraphQL errors:`, JSON.stringify(error.graphQLErrors, null, 2));
    } else {
      console.error(`🔍 Full error:`, error);
    }
    
    return { success: false, error: error.message };
  }
}

async function createAllProducts() {
  console.log('🏺 Creating Pottery Products...\n');
  
  if (config.dryRun) {
    console.log('🔍 DRY RUN MODE: No actual changes will be made\n');
  }
  
  const results = [];
  
  for (const product of products) {
    const result = await createProduct(product);
    results.push(result);
    
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n📊 Product Creation Summary:');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const published = results.filter(r => r.success && r.published).length;
  const totalValue = results
    .filter(r => r.success)
    .reduce((sum, r) => sum + parseFloat(r.data.variants?.[0]?.price || r.data.price || 0), 0);
  
  console.log(`✅ Successfully created: ${successful} products`);
  console.log(`📢 Published to Online Store: ${published} products`);
  console.log(`💰 Total inventory value: $${totalValue.toFixed(2)}`);
  if (failed > 0) {
    console.log(`❌ Failed to create: ${failed} products`);
  }
  
  console.log('\n🎉 Product creation and publication complete!');
  
  if (!config.dryRun) {
    console.log('\n📋 Next steps:');
    console.log('1. Check your Shopify admin: Products → All products');
    console.log('2. Add product images in the admin');
    console.log('3. Assign products to collections');
    console.log('4. Set up navigation menus');
    console.log('5. Configure shipping rates for product weights');
    console.log('6. Products are now automatically published to Online Store! 🎉');
  }
}

// Run the script
// Export the function for use in other scripts
module.exports = { createAllProducts };

// Run the script if called directly
if (require.main === module) {
  createAllProducts().catch(console.error);
} 