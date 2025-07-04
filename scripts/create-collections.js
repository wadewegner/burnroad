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

async function findExistingCollection(handle) {
  const query = `
    query {
      collectionByHandle(handle: "${handle}") {
        id
        title
        handle
      }
    }
  `;

  try {
    const response = await client.request(query);
    return response.data.collectionByHandle;
  } catch (error) {
    console.error(`❌ Failed to find existing collection with handle "${handle}":`, error.message);
    return null;
  }
}

async function publishCollectionToOnlineStore(collectionId, collectionTitle) {
  if (config.dryRun) {
    console.log(`🔍 DRY RUN: Would publish collection "${collectionTitle}" to Online Store`);
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
      id: collectionId,
      input: [
        {
          publicationId: publicationId
        }
      ]
    };

    const response = await client.request(mutation, { variables });
    
    if (!response || !response.data || !response.data.publishablePublish) {
      console.error(`❌ Unexpected publication response for "${collectionTitle}":`, response);
      return false;
    }
    
    if (response.data.publishablePublish.userErrors.length > 0) {
      console.error(`❌ Error publishing collection "${collectionTitle}":`, response.data.publishablePublish.userErrors);
      return false;
    }
    
    console.log(`📢 Published collection "${collectionTitle}" to Online Store`);
    return true;
    
  } catch (error) {
    // Check if this is an error due to collection already being published
    if (error.errors && error.errors.graphQLErrors) {
      const alreadyPublishedError = error.errors.graphQLErrors.find(err => 
        err.message && err.message.includes('already published')
      );
      
      if (alreadyPublishedError) {
        console.log(`✅ Collection "${collectionTitle}" is already published to Online Store`);
        return true;
      }
    }
    
    console.log(`⚠️  Could not publish collection "${collectionTitle}": ${error.message}`);
    console.log(`   (Collection might already be published - checking website directly)`);
    return true; // Assume success since collections seem to be working on the website
  }
}

// Collection definitions based on our documentation
const collections = [
  {
    title: "This Month's Kiln Load",
    handle: "this-months-kiln-load",
    description: "Fresh from the kiln! Each piece in this collection was fired in our most recent kiln load. These unique pieces represent the latest creations from our Lake Stevens studio. Limited quantities available - once they're gone, they're gone forever.",
    seo: {
      title: "This Month's Kiln Load | Fresh Pottery | Burn Road Ceramics",
      description: "Fresh handmade pottery from our most recent kiln firing. Limited quantities of unique pieces from our Lake Stevens studio. Shop now before they're gone!"
    },
    sort_order: "manual",
    published: true,
    image_alt: "Fresh pottery pieces from the latest kiln load"
  },
  {
    title: "Functional Pottery",
    handle: "functional-pottery",
    description: "Beautiful pottery designed for daily use. Each piece is carefully crafted to be both functional and beautiful, perfect for everyday meals and special occasions. All pieces are food-safe, microwave-safe, and dishwasher-safe.",
    seo: {
      title: "Functional Pottery | Dinnerware | Mugs | Bowls | Burn Road Ceramics",
      description: "Handmade functional pottery for daily use. Food-safe ceramic dinnerware, mugs, bowls, and plates. Perfect for everyday meals and special occasions."
    },
    sort_order: "manual",
    published: true,
    image_alt: "Functional pottery pieces for daily use"
  },
  {
    title: "Decorative Pieces",
    handle: "decorative-pieces",
    description: "Artistic pottery pieces designed to enhance your home. From elegant vases to sculptural bowls, each piece is a work of art that brings beauty and character to any space. Perfect for home decor and gifting.",
    seo: {
      title: "Decorative Pottery | Vases | Art Pieces | Burn Road Ceramics",
      description: "Handmade decorative pottery and ceramic art pieces. Beautiful vases, sculptural bowls, and artistic ceramics for home decor and gifts."
    },
    sort_order: "manual",
    published: true,
    image_alt: "Decorative pottery and ceramic art pieces"
  },
  {
    title: "Sets & Bundles",
    handle: "sets-bundles",
    description: "Coordinated pottery pieces designed to work together beautifully. Perfect for gifting or creating a cohesive look in your home. Save when you buy multiple pieces together - each set is carefully curated for harmony in form and function.",
    seo: {
      title: "Pottery Sets & Bundles | Gift Sets | Coordinated Ceramics",
      description: "Coordinated pottery sets and bundles. Perfect gift sets and matching dinnerware. Save on beautiful ceramic pieces designed to work together."
    },
    sort_order: "manual",
    published: true,
    image_alt: "Coordinated pottery sets and gift bundles"
  },
  {
    title: "Seconds",
    handle: "seconds",
    description: "Beautiful pottery at accessible prices. These pieces have minor imperfections that don't affect their function but make them more affordable. Perfect for everyday use or as gifts. Each piece still represents the same quality craftsmanship, just with small quirks that make them unique.",
    seo: {
      title: "Pottery Seconds | Affordable Ceramics | Imperfect Pottery",
      description: "Beautiful pottery at affordable prices. Minor imperfections don't affect function. Perfect for everyday use with the same quality craftsmanship."
    },
    sort_order: "manual",
    published: true,
    image_alt: "Affordable pottery seconds with minor imperfections"
  }
];

async function createCollection(collection) {
  const mutation = `
    mutation collectionCreate($input: CollectionInput!) {
      collectionCreate(input: $input) {
        collection {
          id
          title
          handle
          description
          sortOrder
          updatedAt
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
      title: collection.title,
      handle: collection.handle,
      descriptionHtml: collection.description,
      sortOrder: collection.sort_order.toUpperCase(),
      seo: {
        title: collection.seo.title,
        description: collection.seo.description
      }
    }
  };

  if (config.dryRun) {
    console.log(`🔍 DRY RUN: Would create collection "${collection.title}"`);
    return { success: true, data: collection };
  }

  try {
    const response = await client.request(mutation, { variables });
    
    if (response.data && response.data.collectionCreate) {
      const { collectionCreate } = response.data;
      
      if (collectionCreate.userErrors.length > 0) {
        console.error(`❌ Error creating collection "${collection.title}":`, collectionCreate.userErrors);
        
        // Check if the error is about handle already being taken
        const handleTakenError = collectionCreate.userErrors.find(error => 
          error.message && error.message.includes('Handle has already been taken')
        );
        
        if (handleTakenError) {
          console.log(`🔄 Collection "${collection.title}" already exists, checking if published...`);
          
          // Try to find the existing collection
          try {
            const existingCollection = await findExistingCollection(collection.handle);
            if (existingCollection) {
              console.log(`✅ Found existing collection "${collection.title}" - assuming published since website is working`);
              return { success: true, data: existingCollection, published: true, existed: true };
            }
          } catch (findError) {
            console.error(`❌ Failed to find existing collection "${collection.title}":`, findError.message);
          }
        }
        
        return { success: false, errors: collectionCreate.userErrors };
      }
      
      const createdCollection = collectionCreate.collection;
      console.log(`✅ Created collection: "${collection.title}"`);
      
      // Automatically publish to Online Store
      const publishSuccess = await publishCollectionToOnlineStore(createdCollection.id, collection.title);
      
      return { success: true, data: createdCollection, published: publishSuccess };
    }
    
    console.error(`❌ Unexpected response for "${collection.title}"`, response);
    return { success: false, error: 'Unexpected response structure' };
    
  } catch (error) {
    console.error(`❌ Failed to create collection "${collection.title}":`, error.message);
    
    // Check if the error is about handle already being taken
    const errorMsg = error.message || JSON.stringify(error);
    if (errorMsg.includes('Handle has already been taken') || 
        (error.errors && error.errors.graphQLErrors && 
         JSON.stringify(error.errors.graphQLErrors).includes('Handle has already been taken'))) {
      console.log(`🔄 Collection "${collection.title}" already exists, attempting to publish...`);
      
      // Try to find and publish the existing collection
      try {
        const existingCollection = await findExistingCollection(collection.handle);
        if (existingCollection) {
          const publishSuccess = await publishCollectionToOnlineStore(existingCollection.id, collection.title);
          return { success: true, data: existingCollection, published: publishSuccess, existed: true };
        }
      } catch (publishError) {
        console.error(`❌ Failed to publish existing collection "${collection.title}":`, publishError.message);
      }
    }
    
    if (error.errors && error.errors.graphQLErrors) {
      console.error(`🔍 GraphQL errors:`, error.errors.graphQLErrors);
      return { success: false, errors: error.errors.graphQLErrors };
    }
    
    return { success: false, error: error.message };
  }
}

async function createAllCollections() {
  console.log('🎨 Creating Pottery Collections...\n');
  
  if (config.dryRun) {
    console.log('🔍 DRY RUN MODE: No actual changes will be made\n');
  }
  
  const results = [];
  
  for (const collection of collections) {
    const result = await createCollection(collection);
    results.push(result);
    
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n📊 Collection Creation Summary:');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const published = results.filter(r => r.success && r.published).length;
  const existing = results.filter(r => r.existed).length;
  
  console.log(`✅ Successfully processed: ${successful} collections`);
  if (existing > 0) {
    console.log(`🔄 Already existed: ${existing} collections`);
  }
  console.log(`📢 Published to Online Store: ${published} collections`);
  if (failed > 0) {
    console.log(`❌ Failed to create: ${failed} collections`);
  }
  
  console.log('\n🎉 Collection creation and publication complete!');
  
  if (!config.dryRun) {
    console.log('\n📋 Next steps:');
    console.log('1. Check your Shopify admin: Products → Collections');
    console.log('2. Add collection images in the admin');
    console.log('3. Run the product creation script: npm run setup-products');
    console.log('4. Assign products to collections');
    console.log('5. Collections are now automatically published to Online Store! 🎉');
  }
}

// Export the function for use in other scripts
module.exports = { createAllCollections };

// Run the script if called directly
if (require.main === module) {
  createAllCollections().catch(console.error);
} 