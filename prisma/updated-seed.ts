import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting updated database seed with minimum 30 tokens...')

  // Create default user
  const hashedPassword = await bcrypt.hash('password123', 12)
  
  const defaultUser = await prisma.user.upsert({
    where: { email: 'demo@eacon.app' },
    update: {},
    create: {
      email: 'demo@eacon.app',
      name: 'Demo User',
      password: hashedPassword,
      tokens: 1000,
      accountType: 'FREE',
      createdAt: new Date(),
    },
  })

  console.log('👤 Created default user:', defaultUser.email)

  // Create improved categories with emojis
  const categories = [
    {
      name: 'social-media',
      displayName: '📱 Social Media',
      description: 'Templates for social media platforms',
      icon: '📱',
      color: '#3B82F6',
      isActive: true,
      sortOrder: 1,
    },
    {
      name: 'business',
      displayName: '💼 Business',
      description: 'Professional business templates',
      icon: '💼',
      color: '#1F2937',
      isActive: true,
      sortOrder: 2,
    },
    {
      name: 'lifestyle',
      displayName: '🌟 Lifestyle',
      description: 'Lifestyle and personal content',
      icon: '🌟',
      color: '#F59E0B',
      isActive: true,
      sortOrder: 3,
    },
    {
      name: 'food',
      displayName: '🍽️ Food & Drinks',
      description: 'Food photography and culinary content',
      icon: '🍽️',
      color: '#EF4444',
      isActive: true,
      sortOrder: 4,
    },
    {
      name: 'travel',
      displayName: '✈️ Travel',
      description: 'Travel and adventure content',
      icon: '✈️',
      color: '#10B981',
      isActive: true,
      sortOrder: 5,
    },
    {
      name: 'fashion',
      displayName: '👗 Fashion',
      description: 'Fashion and beauty content',
      icon: '👗',
      color: '#EC4899',
      isActive: true,
      sortOrder: 6,
    },
    {
      name: 'technology',
      displayName: '💻 Technology',
      description: 'Tech and digital content',
      icon: '💻',
      color: '#6366F1',
      isActive: true,
      sortOrder: 7,
    },
    {
      name: 'art',
      displayName: '🎨 Art & Design',
      description: 'Artistic and creative content',
      icon: '🎨',
      color: '#8B5CF6',
      isActive: true,
      sortOrder: 8,
    },
  ]

  console.log('📂 Creating improved categories...')
  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: category,
      create: category,
    })
  }

  // Enhanced templates with minimum 30 tokens and proper categorization
  const templates = [
    // 🔄 TRANSFORM Templates (80+ tokens, require upload)
    {
      title: 'Nàng Tiên Cá Hiện Đại',
      description: 'Biến đổi ảnh thành nàng tiên cá với phong cách hiện đại',
      prompt: 'Transform person into modern mermaid with flowing hair, iridescent scales, underwater palace background, ethereal lighting, fantasy art style',
      style: 'fantasy',
      platform: 'Instagram',
      tags: ['mermaid', 'fantasy', 'transform', 'viral'],
      cost: 0,
      unlockCost: 80,
      category: '🎨 Art & Design',
      type: 'TRANSFORM',
      requiresUpload: true,
      isActive: true,
    },
    {
      title: 'Portrait to Anime Style',
      description: 'Biến đổi ảnh chân dung thành phong cách anime',
      prompt: 'Transform portrait photo into anime style, maintain facial features, anime art style, detailed eyes, soft shading',
      style: 'anime',
      platform: 'Instagram',
      tags: ['portrait', 'anime', 'transform', 'viral'],
      cost: 0,
      unlockCost: 80,
      category: '🎨 Art & Design',
      type: 'TRANSFORM',
      requiresUpload: true,
      isActive: true,
    },
    {
      title: 'Age Progression AI',
      description: 'Xem bạn sẽ như thế nào khi già đi',
      prompt: 'Age progression of person in photo, realistic aging effects, maintain identity, natural progression',
      style: 'realistic',
      platform: 'Instagram',
      tags: ['age', 'progression', 'transform', 'viral'],
      cost: 0,
      unlockCost: 85,
      category: '🌟 Lifestyle',
      type: 'TRANSFORM',
      requiresUpload: true,
      isActive: true,
    },
    {
      title: 'Gender Swap AI',
      description: 'Xem bạn sẽ như thế nào với giới tính khác',
      prompt: 'Gender swap transformation, maintain facial features, realistic appearance, natural transition',
      style: 'realistic',
      platform: 'Instagram',
      tags: ['gender', 'swap', 'transform', 'viral'],
      cost: 0,
      unlockCost: 85,
      category: '🌟 Lifestyle',
      type: 'TRANSFORM',
      requiresUpload: true,
      isActive: true,
    },
    {
      title: 'Superhero Transformation',
      description: 'Biến thành siêu anh hùng từ ảnh của bạn',
      prompt: 'Transform person into superhero, heroic costume, dynamic pose, comic book style, powerful appearance',
      style: 'comic',
      platform: 'Instagram',
      tags: ['superhero', 'comic', 'transform', 'viral'],
      cost: 0,
      unlockCost: 90,
      category: '🎨 Art & Design',
      type: 'TRANSFORM',
      requiresUpload: true,
      isActive: true,
    },
    {
      title: 'Professional Headshot',
      description: 'Chuyển ảnh thường thành ảnh profile chuyên nghiệp',
      prompt: 'Transform casual photo into professional headshot, business attire, professional lighting, LinkedIn quality',
      style: 'professional',
      platform: 'LinkedIn',
      tags: ['professional', 'headshot', 'transform', 'business'],
      cost: 0,
      unlockCost: 80,
      category: '💼 Business',
      type: 'TRANSFORM',
      requiresUpload: true,
      isActive: true,
    },

    // 🎨 GENERATE Templates - Premium (65-80 tokens)
    {
      title: 'Công Chúa Rừng Xanh',
      description: 'Nữ hoàng thiên nhiên với vương miện hoa lá',
      prompt: 'Forest princess with flower crown, emerald dress, magical forest background, sunlight filtering through trees',
      style: 'fantasy',
      platform: 'Instagram',
      tags: ['princess', 'nature', 'crown', 'viral'],
      cost: 0,
      unlockCost: 75,
      category: '🎨 Art & Design',
      type: 'GENERATE',
      requiresUpload: false,
      isActive: true,
    },
    {
      title: 'Phụ Nữ Cyberpunk',
      description: 'Cô gái tương lai với neon và công nghệ',
      prompt: 'Cyberpunk woman with neon hair, futuristic clothing, city lights background, high-tech aesthetic',
      style: 'cyberpunk',
      platform: 'Instagram',
      tags: ['cyberpunk', 'futuristic', 'neon', 'viral'],
      cost: 0,
      unlockCost: 70,
      category: '💻 Technology',
      type: 'GENERATE',
      requiresUpload: false,
      isActive: true,
    },
    {
      title: 'AI Robot Assistant',
      description: 'Robot AI hỗ trợ thân thiện',
      prompt: 'Friendly AI robot assistant with sleek design, holographic interface, futuristic office background',
      style: 'sci-fi',
      platform: 'LinkedIn',
      tags: ['ai', 'robot', 'technology', 'professional'],
      cost: 0,
      unlockCost: 70,
      category: '💻 Technology',
      type: 'GENERATE',
      requiresUpload: false,
      isActive: true,
    },
    {
      title: 'Abstract Art Masterpiece',
      description: 'Nghệ thuật trừu tượng đầy màu sắc',
      prompt: 'Vibrant abstract art with flowing colors, geometric patterns, modern artistic style, gallery-worthy composition',
      style: 'abstract',
      platform: 'Instagram',
      tags: ['abstract', 'art', 'colorful', 'modern'],
      cost: 0,
      unlockCost: 65,
      category: '🎨 Art & Design',
      type: 'GENERATE',
      requiresUpload: false,
      isActive: true,
    },

    // 🎨 GENERATE Templates - Standard (45-60 tokens)
    {
      title: 'CEO Portrait',
      description: 'Ảnh chân dung CEO chuyên nghiệp',
      prompt: 'Professional CEO portrait, confident expression, business suit, modern office background, executive lighting',
      style: 'professional',
      platform: 'LinkedIn',
      tags: ['ceo', 'business', 'professional', 'portrait'],
      cost: 0,
      unlockCost: 60,
      category: '💼 Business',
      type: 'GENERATE',
      requiresUpload: false,
      isActive: true,
    },
    {
      title: 'Startup Team',
      description: 'Đội ngũ startup năng động',
      prompt: 'Dynamic startup team working together, modern workspace, laptops and whiteboards, collaborative atmosphere',
      style: 'professional',
      platform: 'LinkedIn',
      tags: ['startup', 'team', 'collaboration', 'business'],
      cost: 0,
      unlockCost: 55,
      category: '💼 Business',
      type: 'GENERATE',
      requiresUpload: false,
      isActive: true,
    },
    {
      title: 'Fashion Model Portrait',
      description: 'Chân dung người mẫu thời trang',
      prompt: 'High fashion model portrait, elegant pose, designer clothing, studio lighting, magazine quality',
      style: 'fashion',
      platform: 'Instagram',
      tags: ['fashion', 'model', 'portrait', 'elegant'],
      cost: 0,
      unlockCost: 50,
      category: '👗 Fashion',
      type: 'GENERATE',
      requiresUpload: false,
      isActive: true,
    },
    {
      title: 'Yoga Wellness',
      description: 'Tư thế yoga thư giãn',
      prompt: 'Peaceful yoga pose in nature setting, meditation atmosphere, serene expression, wellness lifestyle',
      style: 'lifestyle',
      platform: 'Instagram',
      tags: ['yoga', 'wellness', 'meditation', 'nature'],
      cost: 0,
      unlockCost: 45,
      category: '🌟 Lifestyle',
      type: 'GENERATE',
      requiresUpload: false,
      isActive: true,
    },
    {
      title: 'Street Style Fashion',
      description: 'Thời trang đường phố sành điệu',
      prompt: 'Trendy street style outfit, urban background, confident pose, modern fashion photography',
      style: 'street',
      platform: 'Instagram',
      tags: ['street', 'fashion', 'urban', 'trendy'],
      cost: 0,
      unlockCost: 50,
      category: '👗 Fashion',
      type: 'GENERATE',
      requiresUpload: false,
      isActive: true,
    },

    // 🎨 GENERATE Templates - Basic (30-40 tokens)
    {
      title: 'Artisan Coffee',
      description: 'Cà phê latte art chuyên nghiệp',
      prompt: 'Beautiful latte art in white cup, coffee shop setting, warm lighting, artistic foam design',
      style: 'food',
      platform: 'Instagram',
      tags: ['coffee', 'latte art', 'cafe', 'artisan'],
      cost: 0,
      unlockCost: 35,
      category: '🍽️ Food & Drinks',
      type: 'GENERATE',
      requiresUpload: false,
      isActive: true,
    },
    {
      title: 'Gourmet Burger',
      description: 'Hamburger gourmet chất lượng cao',
      prompt: 'Gourmet burger with fresh ingredients, restaurant presentation, appetizing photography, food styling',
      style: 'food',
      platform: 'Instagram',
      tags: ['burger', 'gourmet', 'food', 'restaurant'],
      cost: 0,
      unlockCost: 35,
      category: '🍽️ Food & Drinks',
      type: 'GENERATE',
      requiresUpload: false,
      isActive: true,
    },
    {
      title: 'Tropical Paradise',
      description: 'Bãi biển nhiệt đới thiên đường',
      prompt: 'Pristine tropical beach with crystal clear water, palm trees, white sand, vacation paradise',
      style: 'travel',
      platform: 'Instagram',
      tags: ['beach', 'tropical', 'paradise', 'vacation'],
      cost: 0,
      unlockCost: 40,
      category: '✈️ Travel',
      type: 'GENERATE',
      requiresUpload: false,
      isActive: true,
    },
    {
      title: 'Mountain Adventure',
      description: 'Cuộc phiêu lưu trên núi',
      prompt: 'Mountain hiking adventure, scenic landscape, backpacker with stunning views, outdoor exploration',
      style: 'adventure',
      platform: 'Instagram',
      tags: ['mountain', 'hiking', 'adventure', 'nature'],
      cost: 0,
      unlockCost: 35,
      category: '✈️ Travel',
      type: 'GENERATE',
      requiresUpload: false,
      isActive: true,
    },
    {
      title: 'Fresh Sushi',
      description: 'Sushi tươi ngon đẹp mắt',
      prompt: 'Fresh sushi platter with wasabi and ginger, Japanese restaurant setting, artistic food presentation',
      style: 'food',
      platform: 'Instagram',
      tags: ['sushi', 'japanese', 'fresh', 'restaurant'],
      cost: 0,
      unlockCost: 30,
      category: '🍽️ Food & Drinks',
      type: 'GENERATE',
      requiresUpload: false,
      isActive: true,
    },
    {
      title: 'City Night Lights',
      description: 'Đêm thành phố với ánh đèn',
      prompt: 'City skyline at night with beautiful lights, urban photography, metropolitan atmosphere, neon glow',
      style: 'urban',
      platform: 'Instagram',
      tags: ['city', 'night', 'lights', 'urban'],
      cost: 0,
      unlockCost: 30,
      category: '✈️ Travel',
      type: 'GENERATE',
      requiresUpload: false,
      isActive: true,
    }
  ]

  console.log('🎨 Creating updated templates with minimum 30 tokens...')
  const createdTemplates = []
  for (const template of templates) {
    const createdTemplate = await prisma.template.create({
      data: template,
    })
    createdTemplates.push(createdTemplate)
    console.log(`✅ Created: ${template.title} (${template.unlockCost} tokens, ${template.type})`)
  }

  // Create initial token transaction
  await prisma.tokenTransaction.create({
    data: {
      userId: defaultUser.id,
      amount: 1000,
      type: 'EARNED',
      description: 'Welcome bonus',
      createdAt: new Date(),
    },
  })

  // Summary statistics
  const generateCount = templates.filter(t => t.type === 'GENERATE').length
  const transformCount = templates.filter(t => t.type === 'TRANSFORM').length
  const minPrice = Math.min(...templates.map(t => t.unlockCost))
  const maxPrice = Math.max(...templates.map(t => t.unlockCost))
  const avgPrice = Math.round(templates.reduce((sum, t) => sum + t.unlockCost, 0) / templates.length)

  console.log('\n🎉 Updated database seeded successfully!')
  console.log(`📊 Template Statistics:`)
  console.log(`   Total: ${templates.length} templates`)
  console.log(`   🎨 GENERATE: ${generateCount} templates`)
  console.log(`   🔄 TRANSFORM: ${transformCount} templates`)
  console.log(`   💰 Price range: ${minPrice}-${maxPrice} tokens (avg: ${avgPrice})`)
  console.log(`   ✅ All templates ≥ 30 tokens minimum`)
  console.log(`   📂 8 improved categories with emojis`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  }) 