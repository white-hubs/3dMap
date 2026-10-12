import React from 'react'

interface MapLoaderProps {
  progress: number // 0 - 100
  visible: boolean
  title?: string
  description?: string
  customClass?: string
}

const MapLoader: React.FC<MapLoaderProps> = ({ progress, visible, customClass='fixed', title='地图资源加载中...', description='正在初始化 WebGL 渲染环境，首次加载资源较多...' }) => {
  if (!visible) return null

  return (
    <div className={`inset-0 z-[9999] flex flex-col items-center justify-center bg-[#000814f2] transition-opacity duration-700 ${customClass}`}>
      <div className="w-[400px] text-center">
        {/* 标题部分 */}
        <h2 className="mb-6 text-lg tracking-[0.2em] text-[#2153b5] drop-shadow-[0_0_10px_rgba(80,187,254,0.5)]">
          {title}
        </h2>

        {/* 进度条外壳 */}
        <div className="flex items-center gap-4">
          <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/10">
            {/* 动态进度填充 */}
            <div
              className="h-full bg-gradient-to-r from-[#2153b5] to-[#2153b5] shadow-[0_0_15px_#2153b5] transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            >
              {/* 光效扫描 */}
              <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </div>
          </div>

          {/* 百分比数字 */}
          {/* <span className="w-12 font-mono text-sm text-white">{progress}%</span> */}
        </div>

        {/* 底部提示 */}
        <p className="mt-4 text-xs text-white/40">{description}</p>
      </div>

      {/* 背景点缀（可选：增加科技感） */}
      <div className="absolute inset-0 -z-10 opacity-20 bg-[radial-gradient(circle_at_center,_#001a33_0%,_transparent_70%)]" />
    </div>
  )
}

export default MapLoader
