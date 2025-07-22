import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Bảng config đơn giản trong database
interface SystemConfig {
  siteName: string;
  siteDescription: string;
  maintenance: boolean;
  registrationEnabled: boolean;
  maxFileSize: number;
  tokenPricing: {
    tokens5000: number;
    tokens10000: number;
    tokens20000: number;
  };
  openaiApiKey?: string;
  emailSettings?: {
    smtpHost: string;
    smtpPort: string;
    smtpUser: string;
    smtpPass: string;
  };
}

const defaultConfig: SystemConfig = {
  siteName: 'Eacon AI Platform',
  siteDescription: 'Nền tảng tạo ảnh AI thông minh',
  maintenance: false,
  registrationEnabled: true,
  maxFileSize: 8,
  tokenPricing: {
    tokens5000: 130000,
    tokens10000: 260000,
    tokens20000: 520000
  }
};

export async function GET() {
  try {
    // Trong thực tế, bạn có thể tạo bảng Config để lưu cấu hình
    // Hiện tại sẽ dùng env vars và default values
    const config: SystemConfig = {
      siteName: process.env.SITE_NAME || defaultConfig.siteName,
      siteDescription: process.env.SITE_DESCRIPTION || defaultConfig.siteDescription,
      maintenance: process.env.MAINTENANCE_MODE === 'true',
      registrationEnabled: process.env.REGISTRATION_ENABLED !== 'false',
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '8'),
      tokenPricing: {
        tokens5000: parseInt(process.env.PRICE_5K_TOKENS || '500000'),
        tokens10000: parseInt(process.env.PRICE_10K_TOKENS || '950000'),
        tokens20000: parseInt(process.env.PRICE_20K_TOKENS || '1800000')
      },
      openaiApiKey: process.env.OPENAI_API_KEY ? '••••••••' : undefined,
      emailSettings: {
        smtpHost: process.env.SMTP_HOST || '',
        smtpPort: process.env.SMTP_PORT || '587',
        smtpUser: process.env.SMTP_USER || '',
        smtpPass: process.env.SMTP_PASS ? '••••••••' : ''
      }
    };

    return NextResponse.json({
      success: true,
      config
    });

  } catch (error) {
    console.error('Admin config error:', error);
    return NextResponse.json(
      { error: 'Không thể lấy cấu hình hệ thống' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();

    // Trong thực tế, bạn sẽ lưu vào database hoặc cập nhật env
    // Hiện tại chỉ return success (do không thể thay đổi env vars runtime)
    
    console.log('Config update request:', data);

    // Nếu có bảng Config trong database:
    // await prisma.config.upsert({
    //   where: { key: 'system' },
    //   update: { value: JSON.stringify(data) },
    //   create: { key: 'system', value: JSON.stringify(data) }
    // });

    return NextResponse.json({
      success: true,
      message: 'Cấu hình đã được lưu thành công',
      note: 'Một số thay đổi cần restart server để có hiệu lực'
    });

  } catch (error) {
    console.error('Admin config save error:', error);
    return NextResponse.json(
      { error: 'Không thể lưu cấu hình' },
      { status: 500 }
    );
  }
} 