'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ImageCropperProps {
  imageSrc: string
  onCropComplete: (croppedImageBlob: Blob) => void
  onCancel: () => void
}

// Valid aspect ratios for Stability AI
const ASPECT_RATIOS = [
  { label: '1:1 (Square)', value: 1, width: 1024, height: 1024 },
  { label: '9:7 (Landscape)', value: 9/7, width: 1152, height: 896 },
  { label: '19:13 (Landscape)', value: 19/13, width: 1216, height: 832 },
  { label: '7:4 (Landscape)', value: 7/4, width: 1344, height: 768 },
  { label: '12:5 (Wide)', value: 12/5, width: 1536, height: 640 },
  { label: '5:12 (Tall)', value: 5/12, width: 640, height: 1536 },
  { label: '4:7 (Portrait)', value: 4/7, width: 768, height: 1344 },
  { label: '13:19 (Portrait)', value: 13/19, width: 832, height: 1216 },
  { label: '7:9 (Portrait)', value: 7/9, width: 896, height: 1152 }
]

export default function ImageCropper({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [selectedRatio, setSelectedRatio] = useState<number>(1) // Default to square
  const [isProcessing, setIsProcessing] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    
    const initialCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 80,
        },
        selectedRatio,
        width,
        height
      ),
      width,
      height
    )
    
    setCrop(initialCrop)
    setCompletedCrop(undefined)
  }, [selectedRatio])

  const handleRatioChange = useCallback((ratio: string) => {
    const newRatio = parseFloat(ratio)
    setSelectedRatio(newRatio)
    setCompletedCrop(undefined)
    
    if (imgRef.current) {
      const { width, height } = imgRef.current
      const newCrop = centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 80,
          },
          newRatio,
          width,
          height
        ),
        width,
        height
      )
      setCrop(newCrop)
    }
  }, [selectedRatio])

  const getCroppedImg = useCallback(
    async (image: HTMLImageElement, pixelCrop: PixelCrop): Promise<Blob> => {
      const canvas = canvasRef.current
      if (!canvas) throw new Error('Canvas not found')

      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas context not found')

      // Find the target dimensions for this aspect ratio
      const targetDimensions = ASPECT_RATIOS.find(r => Math.abs(r.value - selectedRatio) < 0.01)
      const outputWidth = targetDimensions?.width || 1024
      const outputHeight = targetDimensions?.height || 1024


      // Set canvas size to target dimensions
      canvas.width = outputWidth
      canvas.height = outputHeight

      // Clear canvas with white background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, outputWidth, outputHeight)

      const rect = image.getBoundingClientRect()
      
      const scaleX = image.naturalWidth / rect.width
      const scaleY = image.naturalHeight / rect.height

      const sourceX = Math.round(pixelCrop.x * scaleX)
      const sourceY = Math.round(pixelCrop.y * scaleY)
      const sourceWidth = Math.round(pixelCrop.width * scaleX)
      const sourceHeight = Math.round(pixelCrop.height * scaleY)

      const clampedX = Math.max(0, Math.min(sourceX, image.naturalWidth - 1))
      const clampedY = Math.max(0, Math.min(sourceY, image.naturalHeight - 1))
      const clampedWidth = Math.max(1, Math.min(sourceWidth, image.naturalWidth - clampedX))
      const clampedHeight = Math.max(1, Math.min(sourceHeight, image.naturalHeight - clampedY))

      ctx.drawImage(
        image,
        clampedX,
        clampedY,
        clampedWidth,
        clampedHeight,
        0,
        0,
        outputWidth,
        outputHeight
      )

      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create blob from canvas'))
          }
        }, 'image/png', 0.95)
      })
    },
    [selectedRatio]
  )

  const handleCropConfirm = useCallback(async () => {
    if (!imgRef.current) {
      alert('Lỗi: Không tìm thấy hình ảnh. Vui lòng thử tải lại.')
      return
    }

    if (!completedCrop) {
      alert('Vui lòng chọn vùng crop trước khi tiếp tục!')
      return
    }

    if (completedCrop.width < 50) {
      alert('Vùng crop quá hẹp. Chiều rộng tối thiểu là 50px.')
      return
    }

    if (completedCrop.height < 50) {
      alert('Vùng crop quá thấp. Chiều cao tối thiểu là 50px.')
      return
    }

    setIsProcessing(true)
    try {
      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop)
      onCropComplete(croppedBlob)
    } catch (error) {
      alert(`Crop thất bại: ${error instanceof Error ? error.message : 'Lỗi không xác định'}. Vui lòng thử lại.`)
    } finally {
      setIsProcessing(false)
    }
  }, [completedCrop, getCroppedImg, onCropComplete])

  const handleCropChange = useCallback((crop: Crop, percentCrop: Crop) => {
    setCrop(percentCrop)
    
    if (completedCrop) {
      setCompletedCrop(undefined)
    }
  }, [completedCrop])

  const handleCropCompleteInternal = useCallback((pixelCrop: PixelCrop, percentCrop: Crop) => {
    if (imgRef.current && pixelCrop && pixelCrop.width > 10 && pixelCrop.height > 10) {
      const expectedHeight = pixelCrop.width / selectedRatio
      const heightDifference = Math.abs(pixelCrop.height - expectedHeight)
      
      let finalPixelCrop: PixelCrop
      
      // Only fix height if it's significantly wrong (like the 100px bug)
      if (heightDifference > 20 && Math.abs(pixelCrop.height - 100) < 5) {
        finalPixelCrop = {
          ...pixelCrop,
          height: Math.round(expectedHeight),
          unit: 'px'
        }
      } else {
        finalPixelCrop = pixelCrop
      }
      
      setCompletedCrop(finalPixelCrop)
    }
  }, [selectedRatio])

  useEffect(() => {
    if (crop && !completedCrop && imgRef.current) {
      const img = imgRef.current
      const rect = img.getBoundingClientRect()
      
      const pixelCrop: PixelCrop = {
        x: Math.round((crop.x / 100) * rect.width),
        y: Math.round((crop.y / 100) * rect.height),
        width: Math.round((crop.width / 100) * rect.width),
        height: Math.round((crop.height / 100) * rect.height),
        unit: 'px'
      }
      
      const expectedHeight = Math.round(pixelCrop.width / selectedRatio)
      if (Math.abs(pixelCrop.height - expectedHeight) > 5) {
        pixelCrop.height = expectedHeight
      }
      
      if (pixelCrop.width > 10 && pixelCrop.height > 10) {
        setCompletedCrop(pixelCrop)
      }
    }
  }, [crop, completedCrop, selectedRatio])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Crop Your Image</h2>
          <p className="text-gray-600 mb-4">
            Chọn tỷ lệ khung hình và điều chỉnh vùng crop để tối ưu cho AI xử lý.
          </p>
          
          {/* Aspect Ratio Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Chọn tỷ lệ khung hình:
            </label>
            <Select value={selectedRatio.toString()} onValueChange={handleRatioChange}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASPECT_RATIOS.map((ratio) => (
                  <SelectItem key={ratio.value} value={ratio.value.toString()}>
                    {ratio.label} ({ratio.width}×{ratio.height})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Image Cropper */}
          <div className="mb-6 flex justify-center">
            <div className="max-w-full max-h-96 overflow-hidden border rounded">
              <ReactCrop
                crop={crop}
                onChange={handleCropChange}
                onComplete={handleCropCompleteInternal}
                aspect={selectedRatio}
                minWidth={30}
                minHeight={30}
                className="max-w-full"
                keepSelection={true}
                circularCrop={false}
                ruleOfThirds={true}
                locked={false}
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop preview"
                  onLoad={onImageLoad}
                  className="block max-w-full max-h-96"
                  style={{ 
                    maxHeight: '384px',
                    objectFit: 'contain',
                    width: 'auto',
                    height: 'auto'
                  }}
                />
              </ReactCrop>
            </div>
          </div>

          {/* Debug Info */}
          {completedCrop && (
            <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
              <strong>Crop Info:</strong> x={Math.round(completedCrop.x)}, y={Math.round(completedCrop.y)}, 
              w={Math.round(completedCrop.width)}, h={Math.round(completedCrop.height)}, 
              ratio={selectedRatio.toFixed(2)}
            </div>
          )}



          {!completedCrop && crop && (
            <div className="mb-4 p-3 bg-yellow-100 rounded text-sm text-yellow-800">
              <strong>Hướng dẫn:</strong> Kéo thả để điều chỉnh vùng crop, sau đó nhấn "Crop & Upload"
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
            >
              Hủy
            </Button>
            <Button
              onClick={handleCropConfirm}
              disabled={!completedCrop || isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? 'Đang xử lý...' : 'Crop & Upload'}
            </Button>
          </div>
        </div>
      </div>

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
} 