import { QuestionCircleFilled } from '@ant-design/icons'
import { Flex, Tooltip } from 'antd'

import boxImg from '@/assets/images/box.png'

export interface IContentItem {
  label: string
  value: string | number
  unit?: string
  toolTip?: string
  active?: boolean
  onClick?: () => any
}

export const ContentItem = ({ label, value, unit, toolTip, active, onClick }: IContentItem) => {
  return (
    <Flex
      justify="space-between"
      align="center"
      className={`h-70px px-20px ${active ? 'bg-[#256AEF]/50' : 'bg-[#2F65CE]/20'}`}
      onClick={onClick}
    >
      <Flex align="center">
        <img src={boxImg} className="w-6 h-6"></img>
        <div className="ml-2.5 text-white/70 text-18px">
          {label}
          {toolTip ? (
            <Tooltip
              title={toolTip}
              trigger={'hover'}
              classNames={{
                container: 'bg-#2A72FF/40!',
                root: 'bg-#2A72FF/40!',
              }}
            >
              <QuestionCircleFilled color="rgba(47,101,206,0.2)" className="ml-6px" />
            </Tooltip>
          ) : null}
        </div>
      </Flex>
      <Flex align="baseline">
        <span className="text-28px font-600">{value}</span>
        <span className="text-18px">{unit}</span>
      </Flex>
    </Flex>
  )
}

/**
 * 内容列表组件
 * 用于接收内容项数据数组并渲染成列表
 * @param data - IContentItem类型的内容项数组，包含每个列表项的label、value和unit信息
 */
const ContentList = ({
  data,
  gap = 15,
  active,
  onClick,
}: {
  data: IContentItem[]
  gap?: number
  active?: number
  onClick?: (item: any, index: number) => any
}) => {
  return (
    <div className="flex-(~ col)" style={{ gap: gap + 'px' }}>
      {data.map((item, index) => (
        <ContentItem
          key={index}
          label={item.label}
          value={item.value}
          unit={item.unit}
          toolTip={item.toolTip}
          active={active === index}
          onClick={() => onClick?.(item, index)}
        />
      ))}
    </div>
  )
}

export default ContentList
