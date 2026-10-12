import React, { useEffect } from 'react'

import { ICON_MAP } from './index'
import './index.css'

interface CityDetailPanelProps {
  visible: boolean
  x: number
  y: number
  title?: string
  data: any[]
  onClose: () => void
}

const CityDetailPanel: React.FC<CityDetailPanelProps> = ({
  visible,
  x,
  y,
  title,
  data,
  onClose,
}) => {
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // 如果弹窗未显示，直接返回
      if (!visible) return

      const target = e.target as HTMLElement

      // 如果点击的不是弹窗内部，也不是地图上的 scatter 点（防止冲突）
      if (!target.closest('.pointer-events-auto')) {
        onClose()
      }
    }

    // 监听 mousedown 比 click 响应更快，且能拦截更多原生交互
    document.addEventListener('mousedown', handleGlobalClick)

    return () => {
      document.removeEventListener('mousedown', handleGlobalClick)
    }
  }, [visible, onClose])

  return (
    visible && (
      <div
        className="absolute z-100 pointer-events-none animate-popup" // 容器不阻挡点击
        style={{
          left: x,
          top: y,
          transform: 'translate(40px, -25%)',
        }}
      >
        <div className="pointer-events-auto bg-[#01173F] border border-[#2F65CE] p-4 min-w-200px shadow-[0_0_15px_rgba(42,114,255,0.5)] animate-glow-border">
          {title}
          {/* 装饰小三角：指向左侧图标 */}
          <div
            className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-0 h-0 
        border-t-[8px] border-t-transparent 
        border-b-[8px] border-b-transparent 
        border-r-[8px] border-r-[#01173F]"
          ></div>

          {/* <div className="flex justify-between items-center mb-2">
            <span className="text-white font-bold">{title}</span>
            <span
              className="text-white cursor-pointer hover:text-white ml-4"
              onClick={() => onClose()}
            >
              ✕
            </span>
          </div> */}

          <div className="mt-2">
            {data.map((item, i) => (
              <div
                key={i}
                className="animate-item py-1 text-white text-sm  border-white"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <img src={ICON_MAP[item.type]} className="inline-block w-4 h-4 mr-2" />
                {item.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  )
}

export default CityDetailPanel
