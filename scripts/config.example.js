// Shopify API Configuration
// Copy this file to config.js and fill in your actual values
// Get these from your Shopify Admin: Settings > Apps > Develop apps > Your App

module.exports = {
  shopifyStoreDomain: 'ixufhm-yj.myshopify.com',
  shopifyAccessToken: 'shpat_your_token_here', // Replace with your actual token
  shopifyApiVersion: '2024-10',
  
  // Optional: Set to true to enable dry-run mode (won't actually create anything)
  dryRun: false,
  
  // Store configuration
  storeConfig: {
    name: 'Burn Road Ceramics',
    location: 'Lake Stevens, WA',
    description: 'Small-batch handmade pottery studio',
    monthlyProduction: '50-70 pieces',
    kiln: {
      frequency: '1-2 firings per month',
      capacity: 'Monthly kiln loads'
    }
  }
}; 