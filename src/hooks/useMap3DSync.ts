import { useEffect } from 'react'

export const useMap3DSync = (instance: echarts.ECharts | null) => {
  useEffect(() => {
    if (!instance) return

    const handleRoam = () => {
      // 获取当前所有配置
      const option = instance.getOption() as any

      // 关键：获取用户操作后的第一层（最外层）的最新的 center 和 zoom
      const mainGeo = option.geo[0]
      const currentCenter = mainGeo.center
      const currentZoom = mainGeo.zoom

      // 强制将第一层的状态同步给第二、三层
      instance.setOption(
        {
          geo: [
            {
              // 第一层：通常是交互层，这里可以传空对象，表示保持当前状态
            },
            {
              // 第二层：厚度层
              center: currentCenter,
              zoom: currentZoom,
            },
            {
              // 第三层：阴影层
              center: currentCenter,
              zoom: currentZoom,
            },
          ],
        },
        {
          lazyUpdate: false, // 设为 false，确保同步立即生效，不卡顿
          silent: true, // 阻止同步操作再次触发 roam 事件，防止死循环
        },
      )
    }

    // 监听缩放和平移事件
    instance.on('georoam', handleRoam)

    return () => {
      instance.off('georoam', handleRoam)
    }
  }, [instance])
}
