import { Suspense, lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

type ModuleType = () => Promise<{ default: React.ComponentType<unknown> }>

// 1. 使用 Vite 的 glob 导入所有 pages 下的 .tsx 文件
const pages = import.meta.glob('../pages/**/*.tsx') as Record<string, ModuleType>

export const generateRoutes = (): RouteObject[] => {
  const routes: RouteObject[] = []

  Object.keys(pages).forEach((path) => {
    // 提取路由路径： ../pages/Dashboard.tsx -> dashboard
    const name = path
      .replace('../pages/', '')
      .replace('.tsx', '')
      .replace(/\/index$/, '')
      .toLowerCase()

    // 处理根路由
    const routePath = name === 'index' ? '/' : `/${name}`

    // 2. 使用 lazy 配合动态 import
    const Component = lazy(pages[path])

    routes.push({
      path: routePath,
      element: (
        <Suspense fallback={<div className="flex-center h-screen text-white">页面加载中...</div>}>
          <Component />
        </Suspense>
      ),
    })
  })

  return routes
}
