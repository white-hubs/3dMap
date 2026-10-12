import { useEffect, useMemo, useState } from 'react'

import { geoCentroid, geoMercator } from 'd3-geo'
import type { FeatureCollection, Geometry } from 'geojson'
import * as THREE from 'three'

interface ProvinceMeshProps {
  geometry: THREE.BufferGeometry
  properties: Record<string, unknown>
  center: [number, number]
}

// 1. 配置投影器：将经纬度映射到 3D 空间的 [x, y]
// scale 的值取决于你想要地图多大，100 是一个不错的起始值
const projection = geoMercator()
  .center([104.0, 37.5]) // 中国地理中心大致经纬度
  .scale(100)
  .translate([0, 0])

export const useGeoJSON = (jsonData: any, extrudeHeight: number = 0.1) => {
  const [data, setData] = useState<FeatureCollection | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof jsonData === 'object' && jsonData !== null) {
      setData(jsonData)
    } else if (typeof jsonData === 'string') {
      fetch(jsonData)
        .then((res) => {
          if (!res.ok) throw new Error(`请求失败: ${res.status}`)
          return res.json()
        })
        .then((json) => setData(json))
        .catch((e) => setError(e.message))
    }
  }, [jsonData])

  const meshes = useMemo<ProvinceMeshProps[]>(() => {
    if (!data) return []

    return data.features.map((feature) => {
      const { properties, geometry } = feature as { properties: any; geometry: Geometry }
      const shape = new THREE.Shape()

      // 处理 Polygon 和 MultiPolygon
      const coordinates =
        geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates

      coordinates.forEach((polygon: any) => {
        polygon.forEach((ring: any[], index: number) => {
          // 使用投影器转换每一个坐标点
          const points = ring.map((coord) => {
            const [x, y] = projection([coord[0], coord[1]]) as [number, number]
            // 注意：地理坐标 y 轴向上，而 Three.js 默认 y 轴向上但投影后可能需要微调
            // 这里我们保持投影后的原始输出
            return new THREE.Vector2(x, -y) // 取反 y 主要是为了修正 D3 默认坐标系与 3D 空间的差异
          })

          if (index === 0) {
            shape.setFromPoints(points)
          } else {
            const hole = new THREE.Path()
            hole.setFromPoints(points)
            shape.holes.push(hole)
          }
        })
      })

      // 挤压设置
      const extrudeSettings = {
        depth: extrudeHeight,
        bevelEnabled: false,
      }

      const geometry3D = new THREE.ExtrudeGeometry(shape, extrudeSettings)

      // --- 关键修复：计算中心点 ---
      let center: [number, number] = [0, 0]
      // 如果数据里有 center 属性则直接投影，否则通过 d3 计算质心
      const rawCenter = properties.center || geoCentroid(feature)
      const projectedCenter = projection(rawCenter)
      if (projectedCenter) {
        center = [projectedCenter[0], -projectedCenter[1]]
      }

      return {
        geometry: geometry3D,
        properties,
        center,
      }
    })
  }, [data, extrudeHeight])

  return { meshes, loading: !data && !error, error }
}
