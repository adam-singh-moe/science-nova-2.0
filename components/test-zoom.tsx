"use client"

import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"

export function TestZoomComponent() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Testing react-zoom-pan-pinch Import</h2>
      <div className="border-2 border-gray-300 rounded-lg p-4">
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={3}
        >
          <TransformComponent>
            <div className="bg-blue-100 p-8 text-center">
              <p>This content should be zoomable and pannable</p>
              <p>Scroll to zoom, drag to pan</p>
            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>
    </div>
  )
}
