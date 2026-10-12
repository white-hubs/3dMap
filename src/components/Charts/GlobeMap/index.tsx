import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { ArrowLeftOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { Vector3 } from 'three'

import { ICON_MAP, NAME_MAP, ORDER_MAP } from '@/common/const'
import { mapData as mapMarketList } from '@/common/const/coords‌'
import { AssetMapCompanyType } from '@/common/enum'

import StatisticPanel from '../MapChart/StatisticPanel'
import ChinaLabel from './ChinaLabel'
import MapLoader from './MapLoader'
// 假设这些文件已经有了相应的 .d.ts 定义，或者你可以在下方补充
import { World } from './index.js'
import './index.scss'

// 如果是 Vue 组件在 React 用，需确保有转换层

// --- 类型定义 ---

interface UserData {
  name: string
  center: [number, number] // 经纬度坐标
  [key: string]: any
}

interface LabelInstance {
  init: (content: string, position: Vector3) => void
  setParent: (group: any) => void
  remove: () => void
}

// 这里的 World 类型取决于你的 index.js 暴露了什么，如果没有 TS 定义，可以先用 interface 模拟
interface WorldInstance {
  assets: {
    on: (event: string, cb: (path: string, loaded: number, total: number) => void) => void
  }
  on: (event: string, cb: (eventOrData: any, userData?: any) => void) => void
  destroy: () => void
  goBack: () => void
  updateMapData: (newData: any) => void
  moveCloudGroup: { move: () => void }
  chinaMap: {
    label3d: {
      create: (name: string, className: string, flag: boolean) => LabelInstance
      setLabelStyle: (label: LabelInstance, scale: number, axis: string) => void
    }
    geoProjection: (position: [number, number]) => [number, number]
    outsideLabelGroup: any
    moveCloudGroup: { move: () => void }
    goBack: () => void
    updateData: (newData: any[]) => void
  }
}

type SceneType = 'globe' | 'china' | 'shenzhen'

export default function GlobeMap({ mapData }: { mapData: any }) {
  const mapMarketListRef = useRef(mapMarketList)
  // 1. Refs 定义类型
  const appRef = useRef<WorldInstance | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const chinaLabelRef = useRef<HTMLDivElement | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // 2. States 定义类型
  const [returnBtnShow, setReturnBtnShow] = useState<boolean>(false)
  const [labelData, setLabelData] = useState<any[]>([])
  const [currentScene, setCurrentScene] = useState<SceneType>('china')
  const location = useLocation()
  // 过滤mapData
  const filteredMapData = useMemo(() => {
    if (!mapData || mapData.length === 0) return []
    const idSet = new Set(mapMarketList)
    return mapData
      .map((parent: any) => {
        const isParentMatch = idSet.has(parent.id)
        const matchedChildren = (parent.children || []).filter((child: any) => idSet.has(child.id))
        if (isParentMatch) {
          return {
            ...parent,
            children: matchedChildren,
          }
        } else if (matchedChildren.length > 0) {
          return {
            ...parent,
            children: matchedChildren,
          }
        }
        return null
      })
      .filter(Boolean) as any[] // 移除为 null 的元素
  }, [mapData, mapMarketList])

  // useMemo 统计各个类型的总数
  const statisticsData = useMemo(() => {
    if (!filteredMapData || filteredMapData.length === 0) return []

    // 平铺数据
    const flattenData = (data: any[]): any[] => {
      return data.reduce((acc, item) => {
        acc.push(item)

        if (item.children && item.children.length > 0) {
          acc.push(...flattenData(item.children))
        }
        return acc
      }, [])
    }
    const allNodes = flattenData(filteredMapData)

    const hasPartyFounding = allNodes.some(
      (item) => item.type === AssetMapCompanyType.PartyFounding,
    ) // 是否存在建档企业

    const statisticsObj = allNodes
      .filter((item) => !item.children?.length && item.type !== AssetMapCompanyType.Base) // 只统计没有子节点的叶子节点，并且排除基地显示
      .reduce(
        (acc, curr) => {
          const type = curr.type
          acc[type] = (acc[type] || 0) + 1
          //  如果当前是“建档及经营”，并存在建档企业，则“建档”分类也需要同步 +1
          if (type === AssetMapCompanyType.PartyFoundingOperate && hasPartyFounding) {
            acc[AssetMapCompanyType.PartyFounding] =
              (acc[AssetMapCompanyType.PartyFounding] || 0) + 1
          }
          return acc
        },
        {} as Record<string, number>,
      )
    return Object.entries(statisticsObj)
      .map(([type, count]) => {
        return {
          type,
          label: NAME_MAP[type],
          value:
            type === AssetMapCompanyType.PartyFounding
              ? allNodes.filter((item) => !item.children?.length).length
              : Number(count),
          icon: ICON_MAP[type],
        }
      })
      .sort((a, b) => {
        const orderA = ORDER_MAP[a.type] || 99
        const orderB = ORDER_MAP[b.type] || 99
        return orderA - orderB
      })
  }, [filteredMapData])

  // 移除标签
  const removeOutsideLabel = () => {
    const app = appRef.current
    if (app?.chinaMap?.outsideLabelGroup) {
      app.chinaMap.outsideLabelGroup.traverse((label: any) => {
        if (label && typeof label.remove === 'function') {
          label.remove()
        }
      })
    }
  }

  // 创建外部标签
  // const createOutsideLabel = (content: string, position: [number, number]) => {
  //   const app = appRef.current
  //   if (!app) return

  //   const label = app.chinaMap.label3d.create('', 'outside-label', true)
  //   const [x, y] = app.chinaMap.geoProjection(position)

  //   label.init(content, new Vector3(x, -y, 14))
  //   app.chinaMap.label3d.setLabelStyle(label, 0.08, 'x')
  //   label.setParent(app.chinaMap.outsideLabelGroup)
  //   return label
  // }
  const labelClickData = (userData: UserData) => {
    alert(`你点击了 ${userData.name}}`)
  }

  const handleChinaClick = (app: WorldInstance, userData: UserData) => {
    if (userData.name === '深圳市') {
      setCurrentScene('shenzhen')
      setReturnBtnShow(true)
      app.chinaMap.moveCloudGroup.move()
      removeOutsideLabel()
    } else {
      labelClickDataRef.current?.(userData)
    }
  }

  const labelClickDataRef = useRef(labelClickData)
  useEffect(() => {
    labelClickDataRef.current = labelClickData // 每次渲染都更新最新引用的逻辑
  })

  useEffect(() => {
    mapMarketListRef.current = mapMarketList
  })

  useEffect(() => {
    if (!canvasRef.current) return

    // 初始化 app
    const app = new World(canvasRef.current, { mapData }) as unknown as WorldInstance
    appRef.current = app

    // 资源加载进度
    app.assets.on('onProgress', (_path, itemsLoaded, itemsTotal) => {
      const progress = (itemsLoaded / itemsTotal) * 100
      setProgress(Number(progress.toFixed(2)))
      // console.log(`${progress.toFixed(2)}%!`)
    })

    app.on('renderCompleted', () => {
      // console.log('渲染完成')
      setProgress(100)
      setTimeout(() => {
        setIsLoading(false)
      }, 600)
      setCurrentScene('china')
      app.moveCloudGroup.move()
      // setReturnBtnShow(true)
    })

    // 提取公共转场逻辑
    // const enterChinaScene = (userData: UserData) => {
    //   console.log(userData)
    //   setCurrentScene('china')
    //   app.moveCloudGroup.move()
    //   // setReturnBtnShow(true)
    // }

    // app.on('labelClick', enterChinaScene)
    // app.on('chinaMeshClick', enterChinaScene)

    // 中国地图上的标签点击 取消下钻
    // app.on('chinaMapLabelClick', (userData: UserData) => {
    //   if (userData.name === '深圳总部') {
    //     setCurrentScene('shenzhen')
    //     setReturnBtnShow(true)
    //     app.chinaMap.moveCloudGroup.move()
    //     removeOutsideLabel()
    //   } else {
    //     removeOutsideLabel()
    //     setLabelData({ ...userData })

    //     // 确保 DOM 更新后提取 innerHTML
    //     setTimeout(() => {
    //       if (chinaLabelRef.current) {
    //         createOutsideLabel(chinaLabelRef.current.innerHTML, userData.center)
    //       }
    //     }, 0)
    //   }
    // })
    app.on('chinaMapLabelClick', (userData: UserData) => {
      handleChinaClick(app, userData)
    })

    app.on('szMapLabelClick', (userData: UserData) => {
      console.log('深圳地图标签点击', userData)
      labelClickDataRef.current?.(userData)
    })

    return () => {
      if (appRef.current) {
        appRef.current.destroy()
      }
    }
  }, [])

  // 监听路由变化
  useEffect(() => {
    const app = appRef.current
    if (!app) return
    app.updateMapData(filteredMapData)
    // app.on('chinaMapLabelClick', handleChinaClick)
  }, [location.pathname, mapMarketList])

  const goBack = () => {
    const app = appRef.current
    if (!app) return

    if (currentScene === 'china') {
      setReturnBtnShow(false)
      removeOutsideLabel()
      app.goBack()
      setCurrentScene('china')
    } else if (currentScene === 'shenzhen') {
      setReturnBtnShow(false)
      app.chinaMap.goBack()
      setCurrentScene('china')
      app.moveCloudGroup.move()
    }
  }

  return (
    <div className="globe flex-center">
      <MapLoader progress={progress} visible={isLoading} />
      <canvas id="canvas" ref={canvasRef}></canvas>
      <div className="clouds-wrap">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="cloud"></div>
        ))}
      </div>
      {returnBtnShow && (
        <Button
          type="primary"
          className="absolute left-30% bottom-20% translate-x-[-30%] bg-#2153b5"
          onClick={goBack}
          icon={<ArrowLeftOutlined />}
        >
          返回全国
        </Button>
      )}
      {/* React 渲染一个隐藏的模板供 Three.js 抓取 HTML 内容 */}
      <div ref={chinaLabelRef} style={{ position: 'absolute', pointerEvents: 'none', opacity: 0 }}>
        <ChinaLabel labelData={labelData} />
      </div>
      <StatisticPanel statisticsData={statisticsData} />
    </div>
  )
}
