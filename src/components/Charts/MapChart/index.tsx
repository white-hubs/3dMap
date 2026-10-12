import React, { useEffect, useMemo, useRef, useState } from 'react'

import * as echarts from 'echarts'

import chinaJson from '@/assets/china.json'
import { BGCOLOR_MAP, ICON_MAP, NAME_MAP, ORDER_MAP } from '@/common/const'
import { AssetMapCompanyType } from '@/common/enum'
// 引入地图JSON
import { useMap3DSync } from '@/hooks/useMap3DSync'

import CityDetailPanel from './CityDetailPanel'
import StatisticPanel from './StatisticPanel'

interface MapProps {
  mapData: any[]
}

const Map3D: React.FC<MapProps> = ({ mapData }) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const [instance, setInstance] = useState<echarts.ECharts | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [detailData, setDetailData] = useState<{
    x: number
    y: number
    data: any[]
  }>({
    x: 0,
    y: 0,
    data: [],
  })
  const baseGeo = {
    map: 'china',
    // 必须显式设置这两个属性，地图才会参照容器中心
    layoutCenter: ['50%', '50%'],
    layoutSize: '100%',
    aspectScale: 0.75, // 保持长宽比一致，防止变形导致的视觉偏移
  }
  const mapOption = {
    geo: [
      {
        ...baseGeo,
        roam: 'move', // 只有第一层开启 roam // scale
        zlevel: 10,
        layoutCenter: ['50%', '50%'],
        itemStyle: {
          areaColor: '#8ABBEC', // 亮蓝色
          borderColor: '#B6E6FF', // 亮色边框增强轮廓感
          borderWidth: 2,
          shadowColor: '#005bb7', // 顶层自带微弱内阴影
          shadowBlur: 10,
        },
        emphasis: {
          itemStyle: { areaColor: '#8ABBEC' },
          label: {
            show: false,
          },
        },
        label: { show: false, color: '#fff' },
      },
      {
        ...baseGeo,
        roam: false, // 背景层关闭原生 roam，由 Hook 同步
        zlevel: 9,
        layoutCenter: ['50%', '51.2%'], // 微调偏移产生厚度
        silent: true, // 禁用交互，提升性能
        itemStyle: {
          // areaColor: '#002a6b', // 深邃的底色
          borderWidth: 0,
          shadowColor: 'rgba(0,0,0,0.8)',
          shadowBlur: 5,
          shadowOffsetY: 5,
          areaColor: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1, // 垂直渐变
            colorStops: [
              { offset: 0, color: '#3B6A94' }, // 靠近顶层的地方稍亮
              { offset: 1, color: '#001a3d' }, // 底部变黑
            ],
          },
        },
        animation: false,
      },
      {
        ...baseGeo,
        zlevel: 8,
        layoutCenter: ['50%', '52.5%'],
        silent: true,
        itemStyle: {
          areaColor: 'rgba(83, 132, 170,0.8)', // 极深阴影
          shadowColor: 'rgba(83, 132, 170,1)', // 纯黑投影
          shadowBlur: 30, // 增加模糊半径，营造深邃感
          shadowOffsetY: 10,
        },
        animation: false,
      },
    ],
  }

  // 1. 注册地图数据
  if (!echarts.getMap('china')) {
    echarts.registerMap('china', chinaJson as any)
  }

  useEffect(() => {
    if (chartRef.current) {
      // 初始化
      const chart = echarts.init(chartRef.current)
      chart.setOption(mapOption)

      // 点击事件
      chart.on('click', 'series.scatter', (params) => {
        const data = params.data as any
        if (data.children && data.children.length > 0) {
          // 1. 获取经纬度坐标 [lng, lat]
          const coords = data.value
          // 2. 转换为像素坐标 [x, y]
          const pixelCoords: any = chart.convertToPixel('geo', coords)
          setDetailVisible(true)
          setDetailData({
            x: pixelCoords?.[0] || 0,
            y: pixelCoords?.[1] || 0,
            data: data.children,
          })
        }
      })
      chart.on('georoam', () => {
        setDetailVisible(false)
      })
      // 关键：这里 setInstance 以后，下面的 Hook 才会真正执行
      setInstance(chart)
    }
    return () => instance?.dispose()
  }, [])

  // 过滤mapData
  const filteredMapData = useMemo(() => {
    if (!mapData || mapData.length === 0) return []
    const idSet = new Set(marketList)
    return mapData
      .map((parent) => {
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
  }, [mapData, marketList])

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

  // 监听数据变化,更新坐标
  useEffect(() => {
    if (!instance || !filteredMapData) return

    // 格式化地图数据处理图标
    const formatMapData = filteredMapData.map((item: any) => ({
      ...item,
      name: item.name,
      // 根据数据里的 type 匹配图标，如果没有匹配到则用默认图
      // symbol: ICON_MAP[item.type] || '',
      symbol: `image://${ICON_MAP[item.type]}`,
      symbolSize: item.type === AssetMapCompanyType.City ? 30 : 15,
      symbolOffset: [0, -10],
      // 也可以给不同类型的点设置不同的文字颜色
      label: {
        color: '#ffffff',
        backgroundColor: BGCOLOR_MAP[item.type],
        padding: [3, 10],
        fontSize: 14,
        fontWeight: 'bold',
        opacity: 1,
        // backgroundColor: 'rgba(0, 88, 255, 0.60)',
      },
    }))

    instance.setOption({
      series: [
        {
          name: '资产坐标点',
          type: 'scatter',
          coordinateSystem: 'geo',
          geoIndex: 0,
          zlevel: 11, // 地图上边
          symbol: '',
          symbolSize: [30, 30],
          symbolOffset: [0, -15], // 向上偏移，使图标底部对齐坐标
          data: formatMapData, // 格式: [{name: '北京', value: [116, 39, 100]}]
          label: {
            show: true,
            position: 'top',
            formatter: '{b}',
          },
        },
      ],
    })
  }, [filteredMapData, instance])

  // 重写缩放 实现地图中心点缩放而不是鼠标位置
  useEffect(() => {
    if (!instance || !chartRef.current) return

    const handleWheel = (e: WheelEvent) => {
      // 阻止浏览器默认滚动
      e.preventDefault()

      const options = instance.getOption() as any
      const geoList = options.geo
      if (!geoList || geoList.length === 0) return

      // 获取当前第一层的 zoom
      const currentZoom = geoList[0].zoom || 1

      // 计算新的 zoom (向上滚放大，向下滚缩小)
      const delta = e.deltaY < 0 ? 1.1 : 0.9
      let newZoom = currentZoom * delta

      // 限制缩放区间，防止缩得太小或大到消失
      if (newZoom < 1) newZoom = 1
      if (newZoom > 15) newZoom = 15

      // 核心：手动同步三层 geo 的 zoom，并强制 layoutCenter 居中
      instance.setOption({
        geo: [
          {
            geoIndex: 0,
            zoom: newZoom,
            layoutCenter: ['50%', '50%'], // 强制回弹到中心
          },
          {
            geoIndex: 1,
            zoom: newZoom,
            layoutCenter: ['50%', '51.2%'], // 保持厚度偏移
          },
          {
            geoIndex: 2,
            zoom: newZoom,
            layoutCenter: ['50%', '52.5%'], // 保持阴影偏移
          },
        ],
      })
    }

    const canvas = chartRef.current
    // 注意：必须使用 non-passive 监听才能 preventDefault
    canvas.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      canvas.removeEventListener('wheel', handleWheel)
    }
  }, [instance])

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      if (instance) {
        instance.resize()
        // resize 后重新强制对齐中心，防止“散架”
        instance.setOption({
          geo: [
            { geoIndex: 0, layoutCenter: ['50%', '50%'] },
            { geoIndex: 1, layoutCenter: ['50%', '51.2%'] },
            { geoIndex: 2, layoutCenter: ['50%', '52.5%'] },
          ],
        })
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [instance])

  // 引用 Hook
  useMap3DSync(instance)

  return (
    <>
      <div ref={chartRef} className="w-full h-full" />
      <StatisticPanel statisticsData={statisticsData} />
      <CityDetailPanel
        title="深圳市"
        x={detailData.x}
        y={detailData.y}
        visible={detailVisible}
        data={detailData.data}
        onClose={() => setDetailVisible(false)}
      />
    </>
  )
}

export { ICON_MAP, BGCOLOR_MAP }
export default Map3D
