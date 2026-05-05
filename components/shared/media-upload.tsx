"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import { getBucketConfig, getStorageUrl } from "@/lib/storage/upload"

import {
  UploadCloudIcon,
  XIcon,
  FileIcon,
  ImageIcon,
  FileTextIcon,
  Loader2Icon,
  PlusIcon,
} from "lucide-react"

interface MediaUploadProps {
  bucketType: "catalog" | "inventory" | "expenses" | "payroll" | "orders"
  onUploadComplete: (path: string | string[]) => void
  currentValue?: string | string[]
  recordId?: string
  multiple?: boolean
  maxFiles?: number
  label?: string
  disabled?: boolean
  className?: string
}

interface MediaItem {
  id: string
  file?: File
  path?: string // Relative path in storage
  url?: string // Full public URL
  previewUrl: string
  isUploading: boolean
  progress: number
  error?: string
  type: "image" | "pdf" | "other"
}

export function MediaUpload({
  bucketType,
  onUploadComplete,
  currentValue,
  recordId,
  multiple = false,
  maxFiles = 5,
  label,
  disabled = false,
  className,
}: MediaUploadProps) {
  const [items, setItems] = React.useState<MediaItem[]>([])
  const [isDragging, setIsDragging] = React.useState(false)
  const config = React.useMemo(() => getBucketConfig(bucketType), [bucketType])
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // 1. Cargar valores existentes y generar previsualizaciones (Signed URLs si es privado)
  React.useEffect(() => {
    const loadExisting = async () => {
      if (!currentValue) return

      const paths = Array.isArray(currentValue) ? currentValue : [currentValue]
      
      // Evitar recargar si los paths ya coinciden con los items actuales
      // (Previene bucles infinitos o parpadeos al actualizar el form desde onUploadComplete)
      const currentPaths = items.filter(i => !i.isUploading).map(i => i.path)
      if (paths.length === currentPaths.length && paths.every((p, i) => p === currentPaths[i])) {
        return
      }

      const existingItems: MediaItem[] = await Promise.all(
        paths.map(async (path) => {
          let previewUrl = ""
          
          if (config.public) {
            // Usar utilidad estandarizada para URLs públicas
            previewUrl = getStorageUrl(bucketType, path) || ""
          } else {
            // Obtener Signed URL desde nuestra API
            try {
              const res = await fetch(`/api/storage/signed-url?bucket=${bucketType}&path=${path}`)
              const data = await res.json()
              previewUrl = data.data?.url || ""
            } catch (err) {
              console.error("Error fetching signed URL", err)
            }
          }

          const ext = path.split(".").pop()?.toLowerCase()
          return {
            id: path,
            path,
            url: path.startsWith("http") ? path : undefined,
            previewUrl,
            isUploading: false,
            progress: 100,
            type: ext === "pdf" ? "pdf" : (["jpg", "jpeg", "png", "webp"].includes(ext || "") ? "image" : "other"),
          }
        })
      )

      setItems(existingItems)
    }

    loadExisting()
  }, [currentValue, bucketType, config.public])

  // Limpiar blob URLs al desmontar
  React.useEffect(() => {
    return () => {
      items.forEach((item) => {
        if (item.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(item.previewUrl)
        }
      })
    }
  }, [items])

  const handleFiles = async (files: FileList | File[]) => {
    if (disabled) return

    const newFiles = Array.from(files)
    
    // Validar cantidad máxima
    if (multiple && items.length + newFiles.length > maxFiles) {
      toast.error(`Máximo ${maxFiles} archivos permitidos.`)
      return
    }

    // Si no es múltiple, reemplazamos el actual
    const filesToProcess = multiple ? newFiles : [newFiles[0]]

    const newItems: MediaItem[] = filesToProcess.map((file) => {
      const isImage = file.type.startsWith("image/")
      const isPdf = file.type === "application/pdf"
      
      return {
        id: Math.random().toString(36).substring(7),
        file,
        previewUrl: URL.createObjectURL(file),
        isUploading: true,
        progress: 0,
        type: isImage ? "image" : (isPdf ? "pdf" : "other"),
      }
    })

    if (!multiple) {
      setItems(newItems)
    } else {
      setItems((prev) => [...prev, ...newItems])
    }

    // Iniciar subida para cada archivo nuevo
    for (const item of newItems) {
      if (item.file) {
        await uploadFileAction(item)
      }
    }
  }

  const itemsRef = React.useRef<MediaItem[]>(items)
  
  // Sincronizar ref con el estado
  React.useEffect(() => {
    itemsRef.current = items
  }, [items])

  const notifyParent = (currentItems: MediaItem[]) => {
    // Solo enviamos los paths de los archivos que ya terminaron de subir satisfactoriamente
    // Priorizamos 'url' (URL completa) sobre 'path' (ruta relativa)
    const uploadedPaths = currentItems
      .filter((i) => !i.isUploading && !i.error && (i.url || i.path))
      .map((i) => (i.url || i.path)!)

    if (multiple) {
      onUploadComplete(uploadedPaths)
    } else {
      onUploadComplete(uploadedPaths[0] || "")
    }
  }

  const uploadFileAction = async (item: MediaItem) => {
    if (!item.file) return

    try {
      if (item.file.size > config.maxSize) {
        throw new Error(`Archivo demasiado grande (Máx ${config.maxSize / 1024 / 1024}MB)`)
      }
      if (!config.allowedTypes.includes(item.file.type)) {
        throw new Error("Tipo de archivo no soportado")
      }

      const formData = new FormData()
      formData.append("file", item.file)

      const uploadUrl = `/api/storage/upload?bucket=${bucketType}${recordId ? `&recordId=${recordId}` : ""}`
      
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Error al subir archivo")
      }

      const newPath = result.data.path
      const newUrl = result.data.url
      
      setItems((prev) => {
        const next = prev.map((i) => 
          i.id === item.id ? { ...i, isUploading: false, progress: 100, path: newPath, url: newUrl } : i
        )
        return next
      })
      
      // Usar el ref para obtener los items actuales (que ya incluyen otros posibles cambios)
      // y aplicar el cambio de esta subida específica para la notificación
      const nextItems = itemsRef.current.map((i) => 
        i.id === item.id ? { ...i, isUploading: false, progress: 100, path: newPath, url: newUrl } : i
      )
      notifyParent(nextItems)

    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido"
      toast.error(message)
      setItems((prev) => {
        const next = prev.map((i) => 
          i.id === item.id ? { ...i, isUploading: false, error: message } : i
        )
        return next
      })
      
      const nextItems = itemsRef.current.map((i) => 
        i.id === item.id ? { ...i, isUploading: false, error: message } : i
      )
      notifyParent(nextItems)
    }
  }

  const removeItem = (id: string) => {
    const next = itemsRef.current.filter((i) => i.id !== id)
    setItems(next)
    notifyParent(next)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {label && <label className="text-sm font-medium leading-none text-pretty">{label}</label>}
      
      <div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors mt-2",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-muted/5"
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple={multiple}
          accept={config.allowedTypes.join(",")}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <div className="rounded-full bg-muted p-3">
            <UploadCloudIcon className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-pretty">
              Haz clic o arrastra archivos para subir
            </p>
            <p className="text-xs text-muted-foreground uppercase">
              {config.allowedTypes.map(t => t.split('/')[1]).join(", ")} (Máx {config.maxSize / 1024 / 1024}MB)
            </p>
          </div>
        </div>
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
            >
              {item.type === "image" && item.previewUrl ? (
                <Image
                  src={item.previewUrl}
                  alt="Preview"
                  fill
                  className={cn(
                    "object-cover transition-opacity",
                    item.isUploading ? "opacity-40" : "opacity-100"
                  )}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center p-2 text-center">
                  {item.type === "pdf" ? (
                    <FileTextIcon className="size-8 text-primary/70" />
                  ) : (
                    <FileIcon className="size-8 text-muted-foreground" />
                  )}
                  <span className="mt-2 block w-full truncate px-2 text-[10px] text-muted-foreground">
                    {item.file?.name || item.path?.split("/").pop()}
                  </span>
                </div>
              )}

              {item.isUploading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 p-4">
                  <Loader2Icon className="size-5 animate-spin text-primary" />
                  <Progress value={item.progress} className="mt-2 h-1 w-full" />
                </div>
              )}

              {item.error && (
                <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 p-2">
                  <span className="text-[10px] font-medium text-destructive">
                    {item.error}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeItem(item.id)
                }}
                className="absolute top-1 right-1 rounded-full bg-background/80 p-1 text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-background hover:text-destructive"
              >
                <XIcon className="size-3" />
              </button>
            </div>
          ))}
          
          {multiple && items.length < maxFiles && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 transition-colors hover:border-primary/50 hover:bg-muted/5"
            >
              <PlusIcon className="size-6 text-muted-foreground/50" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
