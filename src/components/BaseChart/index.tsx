import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

// 使用 Antd 的加载和空状态，也可以换成自定义的
import { useSize } from 'ahooks'
import { Empty, Spin } from 'antd'
// 推荐：使用 ahooks 监听容器尺寸变化，比 window.resize 更准
import classNames from 'classnames'
import * as echarts from 'echarts'

// 定义 Props 类型
export interface BaseChartProps {
  option: echarts.EChartsOption | null | undefined // 图表配置
  style?: React.CSSProperties
  className?: string
  theme?: string | object // 'dark' 或自定义主题对象
  loading?: boolean
  onChartReady?: (instance: echarts.ECharts) => void // 暴露实例给父组件
  onClick?: (params: unknown) => void // 点击事件
}

// 暴露给父组件的方法
export interface BaseChartRef {
  getInstance: () => echarts.ECharts | undefined
}

const BaseChart = forwardRef<BaseChartRef, BaseChartProps>((props, ref) => {
  const {
    option,
    style,
    className,
    theme = '', // 默认主题色
    loading = false,
    onChartReady,
    onClick,
  } = props

  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  // 监听容器尺寸变化 (需要 npm install ahooks)
  // 如果不想用 ahooks，可以手写 ResizeObserver
  const size = useSize(chartRef)

  // 1. 初始化图表
  useEffect(() => {
    if (!chartRef.current) return

    // 如果实例已存在，先销毁（防止热更新导致的重复初始化）
    if (chartInstance.current) {
      chartInstance.current.dispose()
    }

    // 初始化实例
    const instance = echarts.init(chartRef.current, theme)
    chartInstance.current = instance

    // 绑定点击事件
    if (onClick) {
      instance.on('click', onClick)
    }

    // 回调实例
    if (onChartReady) {
      onChartReady(instance)
    }

    // 销毁时清理
    return () => {
      instance.dispose()
      chartInstance.current = null
    }
  }, [theme]) // 仅在主题变化或挂载时重新初始化

  // 2. 监听配置变化并更新
  useEffect(() => {
    if (!chartInstance.current || !option) return

    // setOption 是 ECharts 的核心
    // notMerge: false 表示合并新旧配置（实现动态数据动画的关键）
    // lazyUpdate: true 性能更好
    try {
      chartInstance.current.setOption(option, { notMerge: false, lazyUpdate: true })
    } catch (error) {
      console.warn('ECharts setOption error:', error)
    }
  }, [option]) // 依赖 option 变化

  // 3. 监听尺寸变化自动 Resize
  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.resize()
    }
  }, [size]) // 当容器尺寸变化时触发

  // 暴露实例给 ref
  useImperativeHandle(ref, () => ({
    getInstance: () => chartInstance.current || undefined,
  }))

  // 判断是否为空数据 (简单判断 series 是否存在且有数据)
  const isEmpty =
    !option || !option.series || (Array.isArray(option.series) && option.series.length === 0)

  return (
    <div className={classNames('relative w-full h-full', className)} style={style} ref={chartRef}>
      {/* 加载中蒙层 */}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
          <Spin size="large" />
        </div>
      )}

      {/* 空状态蒙层 */}
      {!loading && isEmpty && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <Empty description={<span className="text-gray-400">暂无数据</span>} />
        </div>
      )}
    </div>
  )
})

export default React.memo(BaseChart)
