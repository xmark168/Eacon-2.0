'use client'

import { useState, useRef } from 'react'
import { Upload, Wand2, RefreshCw, Download, Image as ImageIcon } from 'lucide-react'

interface GeneratedImage {
  id: string
  imageUrl: string
  prompt: string
  revisedPrompt?: string
  style: string
  size: string
  createdAt: string
}

export default function ImageAIDemo() {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('realistic')
  const [size, setSize] = useState('1024x1024')
  const [quality, setQuality] = useState('standard')
  const [action, setAction] = useState('generate')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [maskFile, setMaskFile] = useState<File | null>(null)
  const [variationCount, setVariationCount] = useState(2)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const maskInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, isMask: boolean = false) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Vui lòng upload file ảnh hợp lệ (JPG, PNG, WebP)')
      return
    }

    // Validate file size (max 8MB)
    if (file.size > 8 * 1024 * 1024) {
      setError('File quá lớn. Vui lòng chọn ảnh nhỏ hơn 8MB')
      return
    }

    if (isMask) {
      setMaskFile(file)
    } else {
      setUploadedFile(file)
      
      // Upload file for transform and variations actions
      if (action === 'transform' || action === 'variations') {
        try {
          const formData = new FormData()
          formData.append('image', file)
          
          const uploadResponse = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData
          })
          
          // Handle specific HTTP error codes before trying to parse JSON
          if (!uploadResponse.ok) {
                         if (uploadResponse.status === 413) {
               throw new Error('File ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 8MB.')
            } else if (uploadResponse.status === 401) {
              throw new Error('Cần đăng nhập lại.')
            } else if (uploadResponse.status === 400) {
              throw new Error('File ảnh không hợp lệ. Vui lòng upload JPG, PNG, hoặc WebP.')
            }
          }
          
          let uploadData
          try {
            uploadData = await uploadResponse.json()
          } catch (jsonError) {
            // If JSON parsing fails, it might be an HTML error page
            const textResponse = await uploadResponse.text()
            console.error('Failed to parse JSON response:', textResponse)
            throw new Error('Lỗi server: Không thể xử lý upload. Vui lòng thử lại.')
          }
          
          if (uploadData.success) {
            setUploadedImageUrl(uploadData.imageUrl)
            setSuccess(`📸 Ảnh đã được upload: ${file.name}`)
            setTimeout(() => setSuccess(null), 3000)
          } else {
            throw new Error(uploadData.error || 'Failed to upload image')
          }
        } catch (uploadError) {
          console.error('Upload error:', uploadError)
          setError(uploadError instanceof Error ? uploadError.message : 'Lỗi upload ảnh. Vui lòng thử lại.')
        }
      }
    }
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!prompt.trim() && action !== 'variations') {
      setError('Vui lòng nhập mô tả ảnh')
      return
    }

    if ((action === 'edit' || action === 'variations' || action === 'transform') && !uploadedFile) {
      setError('Vui lòng upload ảnh để thực hiện chức năng này')
      return
    }

    if ((action === 'transform' || action === 'variations') && !uploadedImageUrl) {
      setError('Đang upload ảnh, vui lòng đợi...')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      let response: Response

      if (action === 'generate' && !uploadedFile) {
        // Generate image from text only using /api/generate
        response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt.trim(),
            size,
            quality,
            style
          })
        })
      } else if (action === 'edit') {
        // Edit image using /api/images with FormData
        const formData = new FormData()
        formData.append('action', 'edit')
        formData.append('prompt', prompt.trim())
        formData.append('size', size)
        formData.append('quality', quality)
        formData.append('style', style)

        if (uploadedFile) {
          formData.append('image', uploadedFile)
        }

        if (maskFile) {
          formData.append('mask', maskFile)
        }

        response = await fetch('/api/images', {
          method: 'POST',
          body: formData
        })
      } else if (action === 'variations') {
        // Create variations using /api/generate
        response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            createVariations: true,
            sourceImage: uploadedImageUrl
          })
        })
      } else if (action === 'transform') {
        // Transform image using /api/generate
        response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt.trim(),
            size,
            quality,
            style,
            transform: true,
            sourceImage: uploadedImageUrl
          })
        })
      } else {
        throw new Error('Invalid action')
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra')
      }

      if (data.success) {
        if (data.imageUrl) {
          // Single image result
          const newImage = {
            id: Date.now().toString(),
            imageUrl: data.imageUrl,
            prompt: data.prompt || prompt.trim(),
            style,
            size,
            createdAt: new Date().toISOString()
          }
          setGeneratedImages(prev => [newImage, ...prev])
          setSuccess(`✅ ${data.message || 'Hoàn thành thành công'}`)
        } else if (data.imageUrls) {
          // Multiple images (variations)
          const newImages = data.imageUrls.map((url: string, index: number) => ({
            id: `var_${Date.now()}_${index}`,
            imageUrl: url,
            prompt: action === 'variations' ? 'Image variations' : prompt.trim(),
            style,
            size,
            createdAt: new Date().toISOString()
          }))
          setGeneratedImages(prev => [...newImages, ...prev])
          setSuccess(`✅ Đã tạo ${data.imageUrls.length} biến thể ảnh`)
        } else if (data.image) {
          // Single image result from /api/images
          setGeneratedImages(prev => [data.image, ...prev])
          setSuccess(`✅ ${data.message}`)
        }

        if (data.revisedPrompt) {
          setSuccess(prev => `${prev}\n💡 Prompt được AI cải thiện: "${data.revisedPrompt}"`)
        }
      }

    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra')
    } finally {
      setIsLoading(false)
    }
  }

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🤖 AI Image Generator với OpenAI
        </h1>
        <p className="text-gray-600">
          Sinh ảnh, chỉnh sửa và tạo biến thể bằng OpenAI DALL-E
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Control Panel */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Action Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn chức năng
              </label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="generate">🎨 Sinh ảnh từ text</option>
                <option value="edit">✏️ Chỉnh sửa ảnh</option>
                <option value="variations">🔄 Tạo biến thể ảnh</option>
                <option value="transform">🔧 Transform ảnh</option>
              </select>
            </div>

            {/* Prompt Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả ảnh *
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  action === 'generate' 
                    ? 'Một con mèo đang chơi trong vườn hoa...'
                    : action === 'edit'
                    ? 'Thay thế bầu trời bằng hoàng hôn đẹp...'
                    : action === 'transform'
                    ? 'Mô tả ảnh gốc để tạo biến thể...'
                    : 'Mô tả ảnh gốc để tạo biến thể...'
                }
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                required
              />
            </div>

            {/* File Upload for Edit/Variations/Transform */}
            {(action === 'edit' || action === 'variations' || action === 'transform') && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload ảnh gốc *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e)}
                      className="hidden"
                      required
                    />
                    {!uploadedFile ? (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center space-x-2 p-2 text-gray-600 hover:text-blue-600"
                      >
                        <Upload className="h-5 w-5" />
                        <span>Chọn ảnh</span>
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 truncate">{uploadedFile.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setUploadedFile(null)
                              setUploadedImageUrl(null)
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        </div>
                        
                        {uploadedImageUrl && (
                          <div className="mt-2">
                            <img 
                              src={uploadedImageUrl} 
                              alt="Uploaded preview" 
                              className="w-full max-h-32 object-contain rounded border border-gray-200"
                            />
                            <p className="text-xs text-green-600 mt-1">✅ Đã upload thành công</p>
                          </div>
                        )}
                        
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full text-center text-sm text-blue-600 hover:text-blue-800"
                        >
                          Đổi ảnh khác
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mask Upload for Edit */}
                {action === 'edit' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload mask (tùy chọn)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <input
                        ref={maskInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, true)}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => maskInputRef.current?.click()}
                        className="w-full flex items-center justify-center space-x-2 p-2 text-gray-600 hover:text-blue-600"
                      >
                        <ImageIcon className="h-5 w-5" />
                        <span>{maskFile ? maskFile.name : 'Chọn mask'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Variation Count */}
                {action === 'variations' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số lượng biến thể (1-4)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="4"
                      value={variationCount}
                      onChange={(e) => setVariationCount(parseInt(e.target.value) || 1)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phong cách
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="realistic">🎯 Thực tế</option>
                  <option value="artistic">🎨 Nghệ thuật</option>
                  <option value="photographic">📸 Nhiếp ảnh</option>
                  <option value="digital-art">💻 Digital Art</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kích thước
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="1024x1024">⬜ 1024x1024 (Vuông)</option>
                  <option value="1024x1792">📱 1024x1792 (Dọc)</option>
                  <option value="1792x1024">🖥️ 1792x1024 (Ngang)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chất lượng
              </label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="standard">📊 Chuẩn</option>
                <option value="hd">✨ HD</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                  Đang xử lý...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Wand2 className="h-5 w-5 mr-2" />
                  {action === 'generate' ? 'Sinh ảnh' : action === 'edit' ? 'Chỉnh sửa' : action === 'transform' ? 'Transform' : 'Tạo biến thể'}
                </div>
              )}
            </button>
          </form>

          {/* Messages */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm whitespace-pre-line">{success}</p>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🖼️ Kết quả ({generatedImages.length})
          </h2>
          
          {generatedImages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Chưa có ảnh nào được tạo</p>
              <p className="text-sm">Sử dụng form bên trái để sinh ảnh</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {generatedImages.map((image, index) => (
                <div key={image.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">
                        {image.prompt}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {image.style} • {image.size} • {new Date(image.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <button
                      onClick={() => downloadImage(image.imageUrl, `ai-image-${index + 1}.png`)}
                      className="ml-2 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Tải xuống"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="aspect-square w-full max-w-xs mx-auto">
                    <img
                      src={image.imageUrl}
                      alt={image.prompt}
                      className="w-full h-full object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement
                        img.src = '/placeholder-image.png'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 