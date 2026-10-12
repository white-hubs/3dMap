import React from 'react'

import { createFromIconfontCN } from '@ant-design/icons'

/**
 * 使用 createFromIconfontCN 生成 Icon 组件
 * scriptUrl 是你在 IconFont 项目中生成的 JS 地址
 */
const IconFontInstance = createFromIconfontCN({
  scriptUrl: '//at.alicdn.com/t/c/font_5118070_3vjkf8zjpol.js', // 替换为你自己的链接
})

interface IconFontProps {
  type: string // 图标名称，如 'icon-user'
  className?: string // 额外的类名
  style?: React.CSSProperties // 内联样式
  onClick?: () => void // 点击事件
  size?: number | string // 快捷设置大小
  color?: string // 快捷设置颜色
}

const BaseIcon: React.FC<IconFontProps> = ({ type, className, style, size, color, ...rest }) => {
  const customStyle: React.CSSProperties = {
    fontSize: size,
    color: color,
    ...style,
  }

  return <IconFontInstance type={type} className={className} style={customStyle} {...rest} />
}

export default BaseIcon
