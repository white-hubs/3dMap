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
