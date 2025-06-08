# Eacon - AI-Powered Social Media Content Creator

A modern, production-ready web application built with Next.js 14 that allows users to generate and edit AI-powered images for social media content using prompt input, with preview, light editing, and social post scheduling features.

## 🚀 Features

### Core Features
- **AI Image Generation**: Create stunning visuals from text prompts using advanced AI models
- **Template Gallery**: Browse and use professionally designed templates for different platforms
- **Built-in Editor**: Fine-tune images with text overlays, cropping, and logo placement
- **Smart Scheduling**: Schedule posts across social platforms at optimal times
- **Multi-Platform Support**: Optimize content for Instagram, Twitter, Facebook, LinkedIn, and TikTok

### Authentication & User Management
- Email/password authentication with NextAuth
- Google OAuth integration
- User sessions and secure token management
- New users receive 1000 free tokens

### Token-Based System
- Token-based usage tracking
- AI image generation: 20-50 tokens
- Caption suggestions: 5 tokens  
- Premium templates: 15 tokens
- Stripe integration for token purchasing

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS with Material Design principles
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Image Processing**: Sharp

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Eacon2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file based on `.env.example`:
   ```bash
   cp .env.example .env.local
   ```

   Fill in your environment variables:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/eacon"

   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-here"

   # Google OAuth
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"

   # Stripe
   STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
   STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"

   # AI APIs
   STABILITY_API_KEY="your-stability-api-key"
   OPENAI_API_KEY="your-openai-api-key"
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push database schema
   npm run db:push
   
   # Or run migrations (in production)
   npm run db:migrate
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── generate-image/ # AI image generation
│   │   └── tokens/       # Token management
│   ├── dashboard/        # Dashboard page
│   ├── login/            # Login page
│   ├── signup/           # Registration page
│   └── globals.css       # Global styles
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   ├── landing/          # Landing page components
│   └── ui/               # UI components
├── lib/                  # Utility libraries
│   ├── auth.ts          # NextAuth configuration
│   └── prisma.ts        # Prisma client
└── types/               # TypeScript type definitions
```

## 🔧 Configuration

### Database Models
The application uses the following main models:
- **User**: User accounts with token balance
- **Template**: Design templates for different platforms
- **GeneratedImage**: AI-generated images with metadata
- **TokenTransaction**: Token usage and purchase history
- **ScheduledPost**: Social media post scheduling
- **SocialConnection**: Connected social accounts

### API Routes
- `POST /api/auth/signup` - User registration
- `GET|POST /api/auth/[...nextauth]` - NextAuth endpoints
- `POST /api/generate-image` - AI image generation
- `POST /api/ai/suggest` - AI content suggestions
- `POST /api/token/use` - Token usage tracking
- `POST /api/token/purchase` - Token purchasing

## 🎨 Design System

The application follows Material Design principles with:
- **Primary Colors**: Blue gradient (#0ea5e9 to #0284c7)
- **Secondary Colors**: Purple gradient (#d946ef to #c026d3)
- **Surface Colors**: Neutral grays for backgrounds and text
- **Animations**: Smooth transitions using Framer Motion
- **Typography**: Inter font family
- **Shadows**: Material Design elevation system

## 🚀 Deployment

### Environment Variables
Ensure all production environment variables are configured:
- Database connection string
- NextAuth secret and URLs
- OAuth provider credentials
- API keys for AI services
- Stripe keys for payments

### Build & Deploy
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Database Migration
```bash
# Run database migrations in production
npm run db:migrate
```

## 🔐 Security

- Server-side session management with NextAuth
- CSRF protection enabled
- Input validation with Zod schemas
- SQL injection protection with Prisma
- Environment variable protection
- Rate limiting on API endpoints (recommended to add)

## 📈 Performance

- Next.js 14 App Router for optimal performance
- Server-side rendering where appropriate
- Image optimization with Next.js Image component
- Lazy loading for components and images
- Efficient database queries with Prisma

## 🧪 Testing

Currently the project includes:
- TypeScript for type safety
- ESLint for code quality
- Environment validation

Recommended additions:
- Jest for unit testing
- Cypress for e2e testing
- Prisma testing with test database

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation
- Open an issue on GitHub
- Contact the development team

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ User authentication and registration
- ✅ Dashboard with token management
- ✅ Landing page and marketing site
- 🔄 Template gallery implementation
- 🔄 AI image generation integration

### Phase 2 (Next)
- Image editor with basic tools
- Social media scheduling
- Template management system
- User profile and settings

### Phase 3 (Future)
- Team collaboration features
- Advanced analytics
- Custom template creation
- API for third-party integrations
- Mobile app development 

## 🚀 Cấu hình OpenAI DALL-E 3

### 1. Lấy OpenAI API Key
1. Truy cập [OpenAI Platform](https://platform.openai.com/api-keys)
2. Đăng nhập và tạo API key mới
3. Copy API key (bắt đầu với `sk-...`)

### 2. Thêm vào Environment Variables
Tạo file `.env.local` trong thư mục root:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-actual-api-key-here

# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Database URL (nếu có)
DATABASE_URL=your-database-url-here
```

### 3. Restart Development Server
```bash
npm run dev
```

### 4. Chi phí DALL-E 3
- **Standard Quality**: ~$0.04 per image
- **HD Quality**: ~$0.08 per image
- Sizes: 1024x1024, 1024x1792, 1792x1024

**Lưu ý**: Đảm bảo tài khoản OpenAI có đủ credits! 