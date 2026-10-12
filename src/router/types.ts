import type { RouteObject } from 'react-router-dom'

// 扩展路由对象，增加业务元数据
export type AppRouteObject = RouteObject & {
  meta?: {
    title?: string // 页面标题
    requiresAuth?: boolean // 是否需要登录
    hidden?: boolean // 是否在菜单中隐藏
    icon?: string // 菜单图标
  }
  children?: AppRouteObject[]
}
