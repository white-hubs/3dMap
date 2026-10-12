import { useEffect } from 'react'

import autofit from 'autofit.js'

export const useAutofit = (designWidth = 1920, designHeight = 1080) => {
  useEffect(() => {
    // 初始化 autofit
    autofit.init({
      dw: designWidth,
      dh: designHeight,
      el: '#app-container', // 渲染的根容器
      resize: true, // 是否监听 resize
    })

    // 组件卸载时关闭，防止内存泄漏或影响其他页面
    return () => {
      autofit.off()
    }
  }, [designWidth, designHeight])
}
