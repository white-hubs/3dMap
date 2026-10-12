import { Navigate, createHashRouter } from 'react-router-dom'

import BasicLayout from '@/layouts/BasicLayout'
import Login from '@/pages/Login'
import NotFound from '@/pages/NotFound'
import NotPermission from '@/pages/NotPermission'
import Overview from '@/pages/Overview'

import { Guard } from './Guard'
import type { AppRouteObject } from './types'

const routes: AppRouteObject[] = [
  {
    path: '/login',
    element: <Login />,
    meta: { title: '登录' },
  },
  {
    path: '/',
    element: (
      <Guard>
        <BasicLayout />
      </Guard>
    ),
    children: [
      {
        path: '',
        element: <Navigate to="/overview" replace />,
      },
      {
        path: '/overview',
        element: <Overview />,
        meta: { title: '资产总览' },
      },
    ],
  },
  {
    path: '/notPermission',
    element: <NotPermission />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]

export const router = createHashRouter(routes)
