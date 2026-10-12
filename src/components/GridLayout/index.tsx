import React, { useMemo } from 'react'

interface GridLayoutProps {
  cols?: number
  rows?: number
  gap?: number | string
  children: React.ReactNode
  className?: string
}

const GridLayout: React.FC<GridLayoutProps> = ({
  cols = 12,
  rows = 6,
  gap = 16,
  children,
  className,
}) => {
  const style = useMemo(
    () => ({
      display: 'grid',
      // 强制分为固定的 12 列和 6 行
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gridTemplateRows: `repeat(${rows}, 1fr)`,
      // dense 算法非常关键：它会自动寻找空隙填入，防止因为 rowSpan 导致的换行
      gridAutoFlow: 'row dense',
      gap: typeof gap === 'number' ? `${gap}px` : gap,
      height: '100%',
      width: '100%',
      minHeight: 0,
      overflow: 'hidden',
    }),
    [cols, rows, gap],
  )

  return (
    <div className={className} style={style}>
      {children}
    </div>
  )
}

interface GridItemProps {
  col: string | number // 起始列位置
  row: string | number // 起始行位置
  colSpan: number // 跨越几列
  rowSpan: number // 跨越几行
  children: React.ReactNode
  zIndex?: number
}

export const GridItem: React.FC<GridItemProps> = ({
  col,
  row,
  colSpan,
  rowSpan,
  children,
  zIndex,
}) => (
  <div
    style={{
      gridColumn: `${col} / span ${colSpan}`,
      gridRow: `${row} / span ${rowSpan}`,
      // 关键：强制最小高度为0，这样它才会严格遵守 rows="repeat(6, 1fr)" 的比例
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: zIndex ?? 1,
    }}
  >
    {children}
  </div>
)

export default GridLayout
