import { useMemo } from 'react'

import * as echarts from 'echarts'

/**
 * 提取大屏通用的 ECharts 基础配置
 * @param title 图表标题
 */
export const useChartConfig = (title?: string) => {
  const commonConfig = useMemo<echarts.EChartsOption>(
    () => ({
      // 1. 标题样式
      title: title
        ? {
            text: '',
            textStyle: { color: '#fff', fontSize: 16, fontWeight: 'normal' },
            left: 0,
            top: 0,
          }
        : undefined,

      // 2. 绘图网格 (防止坐标轴标签被截断)
      grid: {
        top: title ? 60 : 40,
        right: 20,
        bottom: 50,
        left: 20,
        containLabel: true,
      },

      // 3. 悬浮提示框 (黑色半透明背景)
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderColor: '#6AC161',
        textStyle: { color: '#fff' },
        padding: [10, 10],
      },

      // 4. 图例样式
      legend: {
        textStyle: { color: '#ffffff', fontSize: 14 },
        top: 0,
        itemWidth: 10,
        itemHeight: 10,
      },
    }),
    [title],
  )

  // 大屏常用的坐标轴样式
  const axisStyle = {
    axisLabel: { color: '#a6a9ad' }, // 浅灰文字
    axisLine: { lineStyle: { color: '#333' } }, // 深色轴线
    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.5)', type: 'dashed' as const } }, // 虚线网格
  }

  return { commonConfig, axisStyle }
}
