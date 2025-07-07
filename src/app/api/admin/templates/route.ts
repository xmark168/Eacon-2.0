import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const type = searchParams.get('type') || '';
    const isActive = searchParams.get('isActive');

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } }
      ];
    }

    if (category) {
      where.category = category;
    }

    if (type) {
      where.type = type;
    }

    if (isActive !== null && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              templateUnlocks: true,
              generatedImages: true
            }
          }
        }
      }),
      prisma.template.count({ where })
    ]);

    // Transform data để có usageCount và unlockCount
    const transformedTemplates = templates.map(template => ({
      ...template,
      usageCount: template._count.generatedImages,
      unlockCount: template._count.templateUnlocks,
      _count: undefined
    }));

    return NextResponse.json({
      success: true,
      data: transformedTemplates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Admin templates GET error:', error);
    return NextResponse.json(
      { error: 'Không thể lấy danh sách template' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const template = await prisma.template.create({
      data: {
        title: data.title,
        description: data.description,
        prompt: data.prompt,
        style: data.style,
        platform: data.platform,
        tags: data.tags || [],
        cost: data.cost || 0,
        unlockCost: data.unlockCost || 100,
        category: data.category,
        type: data.type || 'GENERATE',
        requiresUpload: data.requiresUpload || false,
        isActive: data.isActive !== false,
        // Chỉ cần previewImage
        previewImage: data.previewImage || null,
        usageCount: 0,
        unlockCount: 0
      }
    });

    return NextResponse.json({
      success: true,
      data: template
    });

  } catch (error) {
    console.error('Admin templates POST error:', error);
    return NextResponse.json(
      { error: 'Không thể tạo template' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID là bắt buộc' },
        { status: 400 }
      );
    }

    const template = await prisma.template.update({
      where: { id },
      data: {
        title: updateData.title,
        description: updateData.description,
        prompt: updateData.prompt,
        style: updateData.style,
        platform: updateData.platform,
        tags: updateData.tags || [],
        cost: updateData.cost || 0,
        unlockCost: updateData.unlockCost || 100,
        category: updateData.category,
        type: updateData.type || 'GENERATE',
        requiresUpload: updateData.requiresUpload || false,
        isActive: updateData.isActive !== false,
        // Cập nhật previewImage
        previewImage: updateData.previewImage || null,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: template
    });

  } catch (error) {
    console.error('Admin templates PUT error:', error);
    return NextResponse.json(
      { error: 'Không thể cập nhật template' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID là bắt buộc' },
        { status: 400 }
      );
    }

    await prisma.template.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Template đã được xóa'
    });

  } catch (error) {
    console.error('Admin templates DELETE error:', error);
    return NextResponse.json(
      { error: 'Không thể xóa template' },
      { status: 500 }
    );
  }
} 