import { useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { ConfigProvider, type ConfigProviderProps, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'

import brand from '@/common/colors'
import { mapData as defaultMapData, mapDataConfig } from '@/common/const'
import GlobeMap from '@/components/Charts/GlobeMap/index.tsx'
import { useAutofit } from '@/hooks/useAutofit'

const BasicLayout = () => {
  // 在 Layout 级别统一开启大屏适配
  const [locale] = useState<ConfigProviderProps['locale']>(zhCN)
  useAutofit(1920, 1080)
  const getPopupContainer = (triggerNode?: HTMLElement) =>
    triggerNode?.parentElement || document.body
  const location = useLocation()
  const mapData = useMemo(() => {
    return mapDataConfig[location.pathname] || defaultMapData
  }, [location.pathname])

  return (
    <ConfigProvider
      locale={locale}
      theme={{
        // 1. 开启暗黑算法
        algorithm: theme.darkAlgorithm,
        // 2. 定制大屏专属配色
        token: {
          colorPrimary: brand.primary, // 主题色
          borderRadius: 2, // 大屏通常偏向硬朗，圆角设小点
          colorBgContainer: '#000000', // 容器背景色
        },
      }}
      getPopupContainer={getPopupContainer}
    >
      <div className="bg-[url(/src/assets/images/bg.jpg)] bg-cover bg-center w-[100vw] h-[100vh] relative">
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-auto">
          {<GlobeMap mapData={mapData} />}
        </div>
        <div
          id="app-container"
          className="relative z-10 bg-transparent w-[1920px] h-[1080px] overflow-hidden text-white flex flex-col font-sans pointer-events-none"
        >
          <>
            <div className="pointer-events-auto"></div>
            <main className="flex-1 p-4 overflow-hidden">
              <Outlet />
            </main>
          </>
        </div>
      </div>
    </ConfigProvider>
  )
}

export default BasicLayout
