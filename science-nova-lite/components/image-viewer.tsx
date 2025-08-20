"use client"

import * as React from "react"

type Fit = 'contain' | 'cover' | 'fill'

export function ImageViewer({
  url,
  gradient,
  fit = 'contain',
  alt = 'image',
  caption,
  variant = 'canvas',
}: {
  url?: string
  gradient?: string
  fit?: Fit
  alt?: string
  caption?: string
  variant?: 'canvas' | 'stacked'
}) {
  const [loading, setLoading] = React.useState<boolean>(!!url)
  const [error, setError] = React.useState<string | null>(null)
  const [retryKey, setRetryKey] = React.useState<number>(0)

  const imgClasses =
    variant === 'canvas'
      ? 'w-full h-[calc(100%-1.5rem)] rounded border border-gray-200 object-center'
      : 'w-full rounded border border-gray-200 object-center'

  const gradientClasses =
    variant === 'canvas'
      ? 'w-full h-[calc(100%-1.5rem)] rounded border border-gray-200'
      : 'w-full h-48 rounded border border-gray-200'

  const EmptyState = (
    <div
      className={
        variant === 'canvas'
          ? 'w-full h-[calc(100%-1.5rem)] rounded border border-dashed border-gray-300 grid place-items-center text-gray-500 text-sm'
          : 'w-full h-48 rounded border border-dashed border-gray-300 grid place-items-center text-gray-500 text-sm'
      }
    >
      No image
    </div>
  )

  const LoadingState = (
    <div
      aria-busy="true"
      className={
        (variant === 'canvas'
          ? 'w-full h-[calc(100%-1.5rem)]'
          : 'w-full h-48') +
        ' rounded border border-gray-200 overflow-hidden'
      }
    >
      <div className="w-full h-full animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]" />
    </div>
  )

  const ErrorState = (
    <div
      role="alert"
      className={
        (variant === 'canvas'
          ? 'w-full h-[calc(100%-1.5rem)]'
          : 'w-full h-48') +
        ' rounded border border-dashed border-red-300 grid place-items-center text-red-600 text-sm p-3 text-center'
      }
    >
      <div>
        <div className="font-medium">Image failed to load</div>
        <div className="text-xs opacity-80 mt-1 break-all max-w-[32ch] mx-auto">
          {error || 'Unknown error'}
        </div>
        <button
          type="button"
          className="mt-2 inline-flex items-center rounded-md border border-red-200 bg-white/70 px-2.5 py-1.5 text-xs font-medium text-red-700 shadow-sm hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
          onClick={() => {
            setError(null)
            setLoading(!!url)
            setRetryKey((k) => k + 1)
          }}
        >
          Retry
        </button>
      </div>
    </div>
  )

  return (
    <figure className={variant === 'canvas' ? 'w-full h-full' : undefined}>
      {gradient ? (
        <div
          className={gradientClasses}
          style={{ backgroundImage: gradient, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
      ) : url ? (
        <>
          {loading && !error ? LoadingState : null}
          {!error && (
            <img
              key={retryKey}
              src={appendBust(url, retryKey)}
              alt={alt}
              className={imgClasses}
              style={{ objectFit: fit as any }}
              onLoad={() => setLoading(false)}
              onError={(e) => {
                setLoading(false)
                const msg = (e as any)?.nativeEvent?.message || 'Could not load'
                setError(typeof msg === 'string' ? msg : 'Could not load')
              }}
            />
          )}
          {error ? ErrorState : null}
        </>
      ) : (
        EmptyState
      )}
      {caption && <figcaption className="text-xs text-gray-600 mt-1">{caption}</figcaption>}
    </figure>
  )
}

function appendBust(url: string, key: number) {
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}t=${key}`
}

export default ImageViewer
