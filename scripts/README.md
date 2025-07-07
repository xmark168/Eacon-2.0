# Template Quality Checker

Tool để kiểm tra và cải thiện chất lượng templates transform trong database PostgreSQL.

## 🚀 Cài đặt và Chạy

### 1. Cài đặt dependencies
```bash
cd scripts
npm install
```

### 2. Chạy script
```bash
npm start
# hoặc
node template-quality-checker.js
```

## 📋 Tính năng

### 1. **View All Templates** 
- Hiển thị tất cả transform templates
- Phân tích chất lượng từng template
- Cho điểm và xếp hạng A-D

### 2. **Analyze Specific Template**
- Phân tích chi tiết một template theo ID
- Đưa ra gợi ý cải thiện cụ thể
- Hiển thị prompt được cải thiện

### 3. **Auto-Improve All Templates**
- Tự động cải thiện tất cả templates có điểm < 70
- Thêm keywords chất lượng
- Cải thiện technical parameters

### 4. **Update Specific Template**
- Cập nhật prompt và hidden prompt
- Hiển thị template hiện tại trước khi sửa
- Xác nhận thay đổi

### 5. **Generate Quality Report**
- Báo cáo tổng quan chất lượng
- Thống kê phân bố điểm
- Danh sách templates cần cải thiện

## 🎯 Tiêu chí Chấm điểm

### Prompt Quality (100 điểm)
- **Prompt length**: >= 50 ký tự (-20 nếu thiếu)
- **Hidden prompt**: >= 100 ký tự (-25 nếu thiếu)
- **Quality keywords**: Tối thiểu 3/14 keywords (-15 nếu thiếu)
- **Transform style**: Chỉ định style cụ thể (-10 nếu thiếu)
- **Technical parameters**: Có thông số kỹ thuật (-10 nếu thiếu)

### Keywords Chất lượng
```
high quality, detailed, professional, cinematic, artistic,
vibrant, dramatic, lighting, composition, style, mood,
color palette, texture, atmosphere, aesthetic
```

### Transform Styles
```
vintage, modern, artistic, photographic, digital art,
watercolor, oil painting, sketch, cartoon, anime
```

### Technical Parameters
```
aspect ratio, resolution, color grading, contrast,
saturation, brightness, depth of field, bokeh
```

## 📊 Xếp hạng

- **A (80-100)**: Excellent - Chất lượng xuất sắc
- **B (60-79)**: Good - Chất lượng tốt
- **C (40-59)**: Average - Chất lượng trung bình
- **D (0-39)**: Poor - Cần cải thiện

## 🔄 Auto-Improvement Logic

Script sẽ tự động thêm:

### Base Improvements
```
high quality, professional, detailed and realistic,
perfect composition, cinematic lighting
```

### Style-Specific Enhancements
- **Vintage**: `vintage aesthetic, retro colors, aged texture, nostalgic mood, film grain`
- **Artistic**: `artistic interpretation, creative expression, vibrant colors, dynamic composition`
- **Colorful**: `vibrant color palette, rich saturation, rainbow hues, color harmony`
- **Modern**: `contemporary style, clean lines, minimalist approach, modern aesthetic`
- **Dramatic**: `dramatic lighting, high contrast, emotional impact, powerful composition`

### Technical Enhancements
```
highly detailed, 8k resolution, professional photography,
perfect lighting, sharp focus, color grading, depth of field,
realistic textures, award-winning composition
```

## ⚙️ Database Configuration

```javascript
const dbConfig = {
  host: '31.97.187.91',
  port: 5432,
  database: 'eacon',
  user: 'eacon',
  password: 'eacon@123',
  ssl: false
};
```

## 🛡️ Bảo mật

- Chỉ cập nhật templates type = 'transform'
- Xác nhận trước khi auto-improve toàn bộ
- Backup prompt cũ trong log
- Rollback capability

## 📝 Example Usage

### Check single template
```bash
# Chọn option 2, nhập ID template
Enter template ID to analyze: 12345
```

### Auto-improve all
```bash
# Chọn option 3
This will update 30 templates. Continue? (y/N): y
```

### Quality report
```bash
# Chọn option 5
📈 QUALITY REPORT
Total Templates: 30
Average Score: 75/100
Grade Distribution:
  A (80-100): 10 templates
  B (60-79): 15 templates
  C (40-59): 5 templates
  D (0-39): 0 templates
```

## 🔍 Troubleshooting

### Connection Issues
```bash
❌ Database connection failed: connection refused
```
- Kiểm tra IP, port, credentials
- Đảm bảo PostgreSQL server đang chạy
- Kiểm tra firewall rules

### Permission Issues
```bash
❌ Error updating template: permission denied
```
- Kiểm tra user permissions trong database
- Đảm bảo user có quyền UPDATE trên table Template

### SSL Issues
```bash
❌ SSL connection required
```
- Thay đổi `ssl: true` trong dbConfig nếu cần

## 📈 Best Practices

1. **Backup trước khi auto-improve**
2. **Chạy quality report trước để đánh giá**
3. **Test với 1-2 templates trước khi batch update**
4. **Review suggestions trước khi apply**
5. **Monitor performance sau khi update**

## 🎨 Color Coding

- 🟢 **Green**: Success, Grade A
- 🔵 **Blue**: Information
- 🟡 **Yellow**: Warning, Grade C
- 🔴 **Red**: Error, Grade D
- 🟦 **Cyan**: Grade B, Processing 