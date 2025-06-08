# Template URL Utilities

Bộ utilities này giúp tạo URL clean và secure cho templates bằng cách giấu thông tin nhạy cảm như prompt và template details.

## Tại sao cần thiết?

- **URL Clean**: Không còn URL dài với prompt và thông tin template
- **Bảo mật**: Giấu prompt và thông tin nhạy cảm khỏi URL
- **UX tốt hơn**: URL ngắn gọn, dễ share
- **SEO friendly**: URL không có tham số phức tạp

## Cách sử dụng

### 1. Tạo template link trong component

```tsx
import { getTemplateLinkProps } from '@/lib/template-utils'

// Component template
function TemplateCard({ template }) {
  const linkProps = getTemplateLinkProps({
    prompt: template.prompt,
    style: template.style,
    platform: template.platform,
    templateTitle: template.title,
    templateDescription: template.description,
    isTransformTemplate: template.isTransform,
    templateId: template.id
  })

  return (
    <Link {...linkProps}>
      <div className="template-card">
        {template.title}
      </div>
    </Link>
  )
}
```

### 2. Navigate programmatically

```tsx
import { navigateToTemplate } from '@/lib/template-utils'

function handleTemplateSelect() {
  navigateToTemplate({
    prompt: "Create a vintage style photo...",
    style: "vintage",
    platform: "instagram",
    templateTitle: "Vintage Filter",
    templateDescription: "Apply vintage effects",
    isTransformTemplate: true,
    templateId: "15"
  })
}
```

### 3. Tạo URL để sử dụng

```tsx
import { createTemplateUrl } from '@/lib/template-utils'

const url = createTemplateUrl({
  prompt: "Create amazing artwork...",
  style: "artistic",
  platform: "instagram",
  templateTitle: "Art Template",
  isTransformTemplate: false
})

console.log(url) // "/generate?template=123" thay vì URL dài
```

## URL Format

### Trước (URL dài và lộ thông tin):
```
/generate?prompt=Apply+vintage+effects...&style=vintage&platform=instagram&templateTitle=Vintage+Filter&templateDescription=Apply+vintage+effects&transform=true&templateId=15
```

### Sau (URL clean):
```
/generate?mode=transform&template=15
```

## Lưu trữ data

- Thông tin nhạy cảm được lưu trong `sessionStorage`
- Data tự động xóa sau khi sử dụng
- Fallback về URL parameters cho backward compatibility

## Security Benefits

1. **Prompt Protection**: Prompt không hiển thị trên URL
2. **Template Details Hidden**: Title và description được giấu
3. **Clean Sharing**: URL có thể share mà không lộ thông tin
4. **Browser History Clean**: History không chứa thông tin nhạy cảm 