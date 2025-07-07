# Hướng dẫn Migration - Thêm tính năng ảnh cho Template

## Tổng quan

Migration này thêm các trường hình ảnh và thống kê cho bảng Template để hỗ trợ hiển thị ảnh preview, thumbnail và ví dụ.

## Các thay đổi Database Schema

### Trường mới được thêm vào bảng `Template`:

1. **previewImage** (String?, nullable): URL ảnh preview chính
2. **thumbnailImage** (String?, nullable): URL ảnh thumbnail nhỏ  
3. **exampleImages** (String[], array): Mảng URL các ảnh ví dụ
4. **usageCount** (Int, default 0): Số lần template được sử dụng
5. **unlockCount** (Int, default 0): Số lần template được unlock

## Tác động Migration

### ✅ AN TOÀN - KHÔNG MẤT DỮ LIỆU

**Lý do tại sao migration này an toàn:**

1. **Chỉ thêm trường mới**: Không xóa hay sửa đổi trường hiện có
2. **Trường nullable**: `previewImage` và `thumbnailImage` cho phép NULL
3. **Default values**: `exampleImages` default là mảng rỗng, `usageCount` và `unlockCount` default là 0
4. **Backward compatible**: Code cũ vẫn hoạt động bình thường

### Dữ liệu sau migration:

```sql
-- Templates hiện có sẽ có:
previewImage = NULL
thumbnailImage = NULL  
exampleImages = []
usageCount = 0
unlockCount = 0
```

## Lệnh Migration

```bash
# Sử dụng db push (đã thực hiện)
npx prisma db push

# Hoặc tạo migration file (nếu cần)
npx prisma migrate dev --name add_template_images_and_stats
```

## Cập nhật API và Frontend

### 1. API Updates (/api/admin/templates)
- ✅ Hỗ trợ các trường hình ảnh mới trong GET/POST/PUT
- ✅ Transform usageCount/unlockCount từ _count relations

### 2. Admin Interface (/admin/templates)
- ✅ Form fields cho previewImage, thumbnailImage, exampleImages
- ✅ Hiển thị thumbnail trong template cards
- ✅ Thống kê sử dụng thực từ database

### 3. User Interface (tương lai)
- 🔄 Cập nhật trang templates cho users để hiển thị ảnh
- 🔄 Gallery view với thumbnails
- 🔄 Preview modal với example images

## Rollback (nếu cần)

Nếu cần rollback, chỉ cần xóa các trường mới:

```sql
ALTER TABLE "Template" 
DROP COLUMN "previewImage",
DROP COLUMN "thumbnailImage", 
DROP COLUMN "exampleImages",
DROP COLUMN "usageCount",
DROP COLUMN "unlockCount";
```

## Kiểm tra sau Migration

1. **Verify schema**:
```bash
npx prisma db pull
npx prisma generate
```

2. **Test admin interface**:
- Truy cập `/admin/templates`
- Tạo template mới với ảnh
- Chỉnh sửa template hiện có
- Kiểm tra hiển thị thumbnail

3. **Check API**:
```bash
curl -X GET http://localhost:3000/api/admin/templates
```

## Cải tiến tiếp theo

### Tự động cập nhật thống kê:
```sql
-- Cập nhật usageCount từ GeneratedImage
UPDATE "Template" t 
SET "usageCount" = (
  SELECT COUNT(*) FROM "GeneratedImage" g 
  WHERE g."templateId" = t.id
);

-- Cập nhật unlockCount từ TemplateUnlock  
UPDATE "Template" t
SET "unlockCount" = (
  SELECT COUNT(*) FROM "TemplateUnlock" u
  WHERE u."templateId" = t.id
);
```

### Upload ảnh locally:
- Tích hợp với cloud storage (AWS S3, Cloudinary)
- API upload ảnh cho admin
- Resize/optimize ảnh tự động

## Kết luận

✅ **Migration hoàn toàn an toàn**
✅ **Không mất dữ liệu hiện có** 
✅ **Backward compatible**
✅ **Admin interface đã sẵn sàng**

Có thể proceed với confidence! 