# Transform Quality Improvements

## 🎯 **Vấn đề:**
Khi transform ảnh, vật thể chủ yếu thường bị thay đổi quá nhiều, không giữ được đặc điểm gốc.

## 🔧 **Giải pháp:**

### 1. **Preserve Subject Mode** (Mặc định: BẬT)
- **Image Strength**: Giảm từ `0.35` → `0.15` (giữ 85% ảnh gốc)
- **CFG Scale**: Giảm từ `7` → `5` (ít sáng tạo hơn)
- **Steps**: Giảm từ `30` → `20` (thay đổi nhẹ nhàng hơn)

### 2. **Enhanced Prompts**
```javascript
// Preserve Mode (Khuyến nghị)
"Keep the same subject and composition exactly, only apply [effect], preserve original objects and people"

// Standard Mode (Sáng tạo hơn)
"[effect], artistic style, creative interpretation"
```

### 3. **Negative Prompts** (Chỉ khi Preserve Mode)
Ngăn chặn: deformed, distorted, changing subject, different person, different object...

## 🎚️ **User Controls:**

### **Preserve Subject Toggle**
- ✅ **BẬT** (Mặc định): Giữ nguyên vật thể, chỉ thay style
- ⚠️ **TẮT**: Cho phép AI sáng tạo tự do hơn

## 📊 **So sánh Parameters:**

| Setting | Preserve Mode | Standard Mode |
|---------|--------------|---------------|
| Image Strength | 0.15 (15% thay đổi) | 0.35 (35% thay đổi) |
| CFG Scale | 5 (conservative) | 7 (creative) |
| Steps | 20 (subtle) | 30 (detailed) |
| Negative Prompt | ✅ Có | ❌ Không |

## 🔄 **API Changes:**

### **Request:**
```json
{
  "transform": true,
  "sourceImage": "/uploads/image.png",
  "preserveSubject": true,  // ← Tham số mới
  "prompt": "vintage effects",
  "style": "vintage"
}
```

### **Enhanced Function:**
```typescript
transformImageWithStability(sourceImageUrl, prompt, style, preserveSubject)
```

## 🎯 **Kết quả mong đợi:**
- ✅ Giữ nguyên người/vật thể chính
- ✅ Chỉ thay đổi style, màu sắc, hiệu ứng
- ✅ Composition không bị phá vỡ
- ✅ Chất lượng cao hơn, ít artifact
- ✅ Kết quả dự đoán được hơn

## 💡 **Recommendations:**
1. **Luôn dùng Preserve Mode** cho ảnh chân dung
2. **Tắt Preserve Mode** khi muốn AI sáng tạo hoàn toàn
3. **Crop ảnh tốt** trước khi transform
4. **Prompt rõ ràng** về hiệu ứng muốn áp dụng 