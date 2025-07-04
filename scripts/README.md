# Shopify Store Automation Scripts

## Overview

These scripts automate the creation of collections, products, and store configuration for **Burn Road Ceramics** using the Shopify Admin API. This eliminates the need for manual data entry and ensures consistent, professional setup.

## ✨ What These Scripts Do

### 🎨 **Collections Creation**
- Creates 5 specialized pottery collections:
  - **This Month's Kiln Load** - Fresh pieces with limited availability messaging
  - **Functional Pottery** - Daily use pieces with care instructions
  - **Decorative Pieces** - Artistic pieces with styling tips
  - **Sets & Bundles** - Coordinated pieces with gift messaging
  - **Seconds** - Affordable pieces with imperfection education

### 🏺 **Products Creation**
- Creates 12 realistic pottery products with:
  - Detailed descriptions with dimensions and care instructions
  - Professional SEO titles and meta descriptions
  - Comprehensive tagging system (50+ tags)
  - Realistic pricing and inventory levels
  - Proper weight and shipping configuration
  - SKU codes for inventory tracking

### 🔧 **Store Configuration**
- Assigns products to appropriate collections
- Configures navigation menus
- Sets up SEO optimization
- Implements inventory management

## 🔒 Security First

**⚠️ CRITICAL: Never commit API keys to git!**

The `.gitignore` file is configured to exclude `scripts/config.js` from version control. This file will contain your sensitive API keys and should NEVER be committed to GitHub.

**Safe files to commit:**
- ✅ `scripts/config.example.js` - Template without real keys
- ✅ All other script files
- ✅ `scripts/README.md` - Documentation
- ✅ `scripts/package.json` - Dependencies list

**NEVER commit:**
- ❌ `scripts/config.js` - Contains real API keys
- ❌ `scripts/node_modules/` - Large dependency files
- ❌ Any file with real API tokens

## 🛡️ Shopify Theme Deployment Safety

**The `scripts/` folder is completely separate from your Shopify theme and will NOT be deployed to your store.**

**What gets deployed to Shopify:**
- ✅ Theme files: `templates/`, `sections/`, `snippets/`, `assets/`, `config/`, `layout/`, `locales/`
- ✅ These are the files that make your store look and function properly

**What stays in your GitHub repository only:**
- ✅ `scripts/` - Automation tools for your development workflow
- ✅ `docs/` - Documentation for your reference
- ✅ These never get pushed to your live store

**Why this is safe:**
- Shopify only reads theme files from specific directories
- Scripts are development tools, not store content
- Your API keys stay in your local development environment
- GitHub integration only syncs theme files, not scripts

## 🚀 Quick Start Guide

### Step 1: Set Up Shopify API Access

1. **Go to your Shopify Admin:**
   ```
   https://ixufhm-yj.myshopify.com/admin
   ```

2. **Create a Custom App:**
   - Navigate to **Settings** → **Apps and sales channels**
   - Click **Develop apps** → **Create an app**
   - Name it "Store Automation"

3. **Configure API Scopes:**
   Your app needs these permissions:
   ```
   ✅ read_products, write_products
   ✅ read_content, write_content
   ✅ read_online_store_pages, write_online_store_pages
   ✅ read_product_listings, write_product_listings
   ✅ read_inventory, write_inventory
   ```

4. **Install the App:**
   - Click **Install app**
   - Copy the **Admin API access token**

### Step 2: Configure the Scripts

1. **Install Dependencies:**
   ```bash
   cd scripts
   npm install
   ```

2. **Set Up Configuration:**
   ```bash
   # Copy the example config
   cp config.example.js config.js
   
   # Edit config.js with your credentials
   nano config.js
   ```

3. **Add Your API Token:**
   ```javascript
   // config.js
   module.exports = {
     shopifyStoreDomain: 'ixufhm-yj.myshopify.com',
     shopifyAccessToken: 'shpat_your_token_here', // ← Add your token
     shopifyApiVersion: '2024-10',
     dryRun: false // Set to true for testing
   };
   ```

### Step 3: Test the Connection

```bash
# Test API access
npm run test-connection
```

**Expected output:**
```
🔍 Testing Shopify API connection...

📋 Test 1: Basic Shop Information
✅ Shop Info: { name: 'Burn Road Ceramics', myshopifyDomain: 'ixufhm-yj.myshopify.com' }

📦 Test 2: Product API Access
✅ Product API Access: Working

🎉 All tests passed! API connection is working correctly.
```

### Step 4: Run the Full Setup

```bash
# Run complete store setup
npm run setup-all
```

**This will:**
1. ✅ Test API connection
2. ✅ Create 5 collections with descriptions and SEO
3. ✅ Create 12 products with full details
4. ✅ Assign products to collections automatically
5. ✅ Create navigation menus (main and footer)
6. ✅ Provide next steps for completion

## 🎯 Individual Script Usage

### Test Connection Only
```bash
npm run test-connection
```

### Create Collections Only
```bash
npm run setup-collections
```

### Create Products Only
```bash
npm run setup-products
```

### Create Navigation Menus Only
```bash
npm run setup-navigation
```

### Assign Products to Collections Only
```bash
npm run assign-products
```

### Run Complete Setup
```bash
npm run setup-all
```

## 🔍 Dry Run Mode

To test without making changes:

```javascript
// config.js
module.exports = {
  // ... other settings
  dryRun: true // ← Set to true for testing
};
```

Then run any script to see what would happen without actual changes.

## 📦 What Gets Created

### Collections (5 total)
| Collection | Handle | Description |
|-----------|---------|-------------|
| This Month's Kiln Load | `this-months-kiln-load` | Fresh pieces with urgency messaging |
| Functional Pottery | `functional-pottery` | Daily use pieces with care info |
| Decorative Pieces | `decorative-pieces` | Artistic pieces for home decor |
| Sets & Bundles | `sets-bundles` | Coordinated pieces and gifts |
| Seconds | `seconds` | Affordable pieces with character |

### Products (12 total)
| Product | Price | Collection | Inventory |
|---------|-------|------------|----------|
| Sage Green Morning Mug | $32.00 | Functional | 2 pieces |
| Speckled Breakfast Bowl | $38.00 | Functional | 3 pieces |
| Dinner Plate Set (4) | $95.00 | Functional | 1 set |
| Large Serving Bowl | $65.00 | Functional | 2 pieces |
| Tall Cylinder Vase | $58.00 | Decorative | 1 piece |
| Succulent Planter Trio | $42.00 | Decorative | 2 sets |
| Decorative Fruit Bowl | $68.00 | Decorative | 1 piece |
| Coffee Lover's Set | $85.00 | Sets & Bundles | 1 set |
| Place Setting for Two | $125.00 | Sets & Bundles | 1 set |
| Seconds: Everyday Mug | $18.00 | Seconds | 4 pieces |
| Seconds: Small Bowl | $22.00 | Seconds | 3 pieces |

**Total Inventory Value: ~$696.00**

## 🏷️ Tagging System

### Product Type Tags
- `mug`, `bowl`, `plate`, `vase`, `planter`, `set`

### Size Tags
- `small`, `medium`, `large`, `extra-large`

### Color/Glaze Tags
- `sage-green`, `speckled`, `cream`, `white`, `black`, `earth-tones`, `blue-gray`

### Function Tags
- `food-safe`, `microwave-safe`, `dishwasher-safe`, `oven-safe`, `decorative`

### Price Range Tags
- `under-25`, `25-50`, `50-75`, `75-100`, `100-150`

### Special Tags
- `gift-ready`, `seconds`, `unique`, `modern`, `rustic`, `classic`

## 🛠️ Troubleshooting

### Common Issues

**❌ "Config file not found"**
```bash
# Solution: Copy and configure
cp config.example.js config.js
# Then edit config.js with your credentials
```

**❌ "API Connection Error"**
- Check your access token in `config.js`
- Verify your store domain is correct
- Ensure your app has the required API scopes
- Make sure your store isn't password protected

**❌ "Rate limiting errors"**
- Scripts include automatic delays between requests
- If you hit limits, wait a few minutes and retry

**❌ "Permission errors"**
- Verify your app has all required scopes
- Check that the app is installed and active

### Debug Mode

Set `dryRun: true` in `config.js` to see what would happen without making changes.

## 📋 Next Steps After Running Scripts

### 1. **Add Images** (Manual)
- Product images: Go to Products → [Product Name] → Add images
- Collection images: Go to Products → Collections → [Collection Name] → Add image

### 2. **Review Content** (Manual)
- Check product descriptions
- Verify pricing
- Adjust inventory levels

### 3. **Configure Store Settings** (Manual)
- Set up shipping rates (products have weights configured)
- Configure payment settings
- Set up taxes

### 4. **Test Customer Experience** (Manual)
- Browse collections
- Add items to cart
- Test checkout flow

### 5. **Launch** 🚀
- Remove password protection
- Announce your store!

## 🔄 Re-running Scripts

**⚠️ Important:** These scripts will create duplicate items if run multiple times. 

**To start fresh:**
1. Delete existing products and collections in Shopify admin
2. Run scripts again

**To update existing items:**
- Modify the scripts to use update mutations instead of create mutations
- Query for existing items by handle before creating

## 🎨 Customization

### Adding More Products

Edit `scripts/create-products.js` and add to the `products` array:

```javascript
{
  title: "Your New Product",
  handle: "your-new-product",
  description: "Product description...",
  // ... other properties
}
```

### Modifying Collections

Edit `scripts/create-collections.js` and modify the `collections` array.

### Changing Store Configuration

Edit `scripts/config.js` to adjust store settings and behavior.

## 🎯 Success Metrics

**After successful completion:**
- ✅ 5 collections created with professional descriptions
- ✅ 12 products created with complete details
- ✅ $696+ inventory value configured
- ✅ SEO optimization implemented
- ✅ Professional tagging system
- ✅ Inventory tracking ready
- ✅ Ready for images and launch

---

## 📞 Support

If you encounter issues:
1. Check this README for common solutions
2. Review the Shopify Admin API documentation
3. Verify your app permissions and credentials
4. Test with `dryRun: true` first

**Happy selling! 🏺✨** 