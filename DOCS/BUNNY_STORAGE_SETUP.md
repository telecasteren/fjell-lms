# Bunny Storage Setup Guide

## 🐰 Why Bunny Storage?

- **Best Value**: $0.01/GB (10x cheaper than Firebase)
- **No Free Tier Limits**: Pay only for what you use
- **Global CDN**: Fast delivery worldwide
- **Simple API**: Native REST API (no AWS dependencies)
- **500GB Cost**: Only $5/month vs $49.50/month with Firebase

## 🚀 Quick Setup

### 1. Create Bunny Storage Account

1. Go to [Bunny.net](https://bunny.net/)
2. Sign up for an account
3. Go to Storage → Create Storage Zone

### 2. Get Your Credentials

1. **Storage Zone Name**: Your bucket name
2. **API Key**: Found in Storage Zone settings
3. **Region**: Choose closest to your users (e.g., 'ny', 'la', 'sg')

### 3. Environment Variables

Create `.env.local` file with:

```bash
# Bunny Storage Configuration
BUNNY_STORAGE_API_KEY=your_api_key_here
BUNNY_STORAGE_REGION=ny
BUNNY_STORAGE_BUCKET=your_storage_zone_name

# Database URL (existing)
DATABASE_URL="file:./dev.db"

# NextAuth Configuration (existing)
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Enable CDN (Optional but Recommended)

1. Go to CDN → Add Pull Zone
2. Set Origin to your Storage Zone
3. Files will be served from `https://your-pull-zone.b-cdn.net/`

## 🔧 Implementation Details

### Native API Usage

Bunny Storage uses simple HTTP requests:

```typescript
// Upload file
PUT https://storage.bunnycdn.com/bucket/path/file.jpg
Headers: { AccessKey: 'your-api-key' }
Body: file

// Delete file
DELETE https://storage.bunnycdn.com/bucket/path/file.jpg
Headers: { AccessKey: 'your-api-key' }

// List files
GET https://storage.bunnycdn.com/bucket/path/
Headers: { AccessKey: 'your-api-key' }
```

### File URLs

Files are accessible at:

- **Direct**: `https://storage.bunnycdn.com/bucket/path/file.jpg`
- **CDN**: `https://your-pull-zone.b-cdn.net/path/file.jpg`

## 📊 Cost Comparison

| Provider          | 500GB Monthly | Annual Cost | Free Tier            |
| ----------------- | ------------- | ----------- | -------------------- |
| **Bunny Storage** | **$5.00**     | **$60**     | None (pay-as-you-go) |
| Firebase          | $49.50        | $594        | 5GB                  |
| Cloudflare R2     | $7.35         | $88         | 10GB                 |

## 🎯 Benefits

### Cost Savings

- **90% cheaper** than Firebase
- **30% cheaper** than Cloudflare R2
- **No free tier limits** - pay only for what you use

### Performance

- **Global CDN** included
- **Edge locations** worldwide
- **Fast upload/download** speeds

### Simplicity

- **Native API** - no AWS SDK needed
- **Simple authentication** - just API key
- **Predictable pricing** - no surprise charges

## 🧪 Testing

Once configured, test the upload:

1. **Start dev server**: `npm run dev`
2. **Open lesson editor** in a course
3. **Select "Multimedia"** content type
4. **Upload files** - they'll go to Bunny Storage
5. **Check URLs** - files accessible via CDN

## 🔄 Future Extensibility

The abstraction layer is designed for easy provider switching if needed:

```typescript
// Current implementation - Bunny Storage only
const storageManager = new StorageManager({
  provider: "bunny-storage",
  bucket: process.env.BUNNY_STORAGE_BUCKET,
  credentials: {
    apiKey: process.env.BUNNY_STORAGE_API_KEY,
    region: process.env.BUNNY_STORAGE_REGION,
  },
});
```

**Note**: Additional providers can be easily added to the abstraction layer if needed in the future.

## 🎉 Ready to Go!

Bunny Storage is now implemented and ready for testing. Just add your credentials to `.env.local` and start uploading multimedia files!
