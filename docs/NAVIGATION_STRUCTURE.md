# Navigation Structure for Burn Road Ceramics

## Main Navigation Menu Structure

### Primary Navigation (Desktop Header)
The main navigation should be configured in Shopify Admin > Navigation > Main Menu

```
Main Menu Structure:
├── Home (/)
├── Shop All (/collections/all)
├── Collections (Dropdown)
│   ├── This Month's Kiln Load (/collections/this-months-kiln-load)
│   ├── Functional Pottery (/collections/functional-pottery)
│   ├── Decorative Pieces (/collections/decorative-pieces)
│   ├── Sets & Bundles (/collections/sets-bundles)
│   └── Seconds (/collections/seconds)
├── About (/pages/about)
├── Custom Orders (/pages/custom-orders)
└── Contact (/pages/contact)
```

### Secondary Navigation (Footer)
Additional navigation links in the footer:

```
Footer Menu Structure:
├── Shipping & Returns (/pages/shipping-returns)
├── FAQ (/pages/faq)
├── Care Instructions (/pages/care-instructions)
├── This Month's Kiln Load (/pages/this-months-kiln-load)
├── Size Guide (/pages/size-guide)
└── Privacy Policy (/pages/privacy-policy)
```

### Mobile Navigation
Same structure as desktop but optimized for mobile display with collapsible sections.

## Collection URLs & Handles

### Collection Handles (URL-friendly)
- **This Month's Kiln Load**: `this-months-kiln-load`
- **Functional Pottery**: `functional-pottery`
- **Decorative Pieces**: `decorative-pieces`
- **Sets & Bundles**: `sets-bundles`
- **Seconds**: `seconds`

### Page Handles (URL-friendly)
- **About**: `about`
- **Custom Orders**: `custom-orders`
- **Contact**: `contact`
- **Shipping & Returns**: `shipping-returns`
- **FAQ**: `faq`
- **Care Instructions**: `care-instructions`
- **This Month's Kiln Load**: `this-months-kiln-load`
- **Size Guide**: `size-guide`

## Navigation Configuration Steps

### Step 1: Create Collections in Shopify Admin
1. Navigate to **Products > Collections**
2. Create new collections with these exact handles:
   - `this-months-kiln-load`
   - `functional-pottery`
   - `decorative-pieces`
   - `sets-bundles`
   - `seconds`

### Step 2: Update Main Navigation
1. Navigate to **Online Store > Navigation**
2. Edit the "Main menu"
3. Add collection links with the structure above
4. Set up "Collections" as a dropdown menu

### Step 3: Configure Mobile Navigation
1. Ensure mobile navigation uses the same menu structure
2. Test dropdown functionality on mobile devices

### Step 4: Update Footer Navigation
1. Navigate to **Online Store > Navigation**
2. Edit the "Footer menu"
3. Add additional page links as shown above

## SEO Considerations

### Navigation Best Practices
- Use descriptive link text (avoid "Click here")
- Include target keywords in navigation labels
- Keep navigation structure shallow (max 3 levels)
- Ensure all important pages are accessible within 3 clicks

### Collection Navigation Labels
- **This Month's Kiln Load** (targets "fresh pottery", "new pieces")
- **Functional Pottery** (targets "ceramic dinnerware", "pottery bowls")
- **Decorative Pieces** (targets "pottery vases", "ceramic art")
- **Sets & Bundles** (targets "pottery sets", "ceramic gift sets")
- **Seconds** (targets "discounted pottery", "ceramic seconds")

## Collection Page Features

### Filtering Options
Each collection page should support filtering by:
- Price range
- Color/glaze
- Size
- Function (mugs, bowls, plates, etc.)
- Availability

### Sorting Options
- Featured
- Price: Low to High
- Price: High to Low
- Newest
- Best Selling

## Analytics & Tracking

### Navigation Tracking
Monitor these navigation metrics:
- Click-through rates on collection links
- Mobile vs desktop navigation usage
- Drop-off points in navigation flow
- Popular collection pages

### Menu Performance
- Track which collections get the most traffic
- Monitor conversion rates from navigation
- Identify any navigation bottlenecks

## Accessibility

### Navigation Accessibility
- Use semantic HTML for navigation
- Ensure keyboard navigation works
- Provide clear focus indicators
- Include skip navigation links
- Use descriptive alt text for any navigation images

### Screen Reader Support
- Proper heading hierarchy
- Descriptive link text
- ARIA labels where needed
- Logical tab order

This navigation structure supports both the artistic nature of handmade pottery and the practical needs of e-commerce, making it easy for customers to discover and purchase pottery pieces while learning about the craft and process. 