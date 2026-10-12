import { useMemo } from 'react'

import { CaretRightOutlined, DownOutlined, QuestionCircleFilled } from '@ant-design/icons'
import { Dropdown, type MenuProps, Tooltip } from 'antd'

import { defaultDateLabel } from '@/common/const/index'
import { DateType } from '@/common/enum'
import { useGlobalStore } from '@/store'

export const ContentSelect = ({
  onChange,
  items,
  value,
}: {
  onChange: (key: DateType) => void
  items: MenuProps['items']
  value: DateType // 外部传入的当前日期类型
}) => {
  const { setGlobalDateType } = useGlobalStore()
  const handleClick: MenuProps['onClick'] = (menu) => {
    if (items?.length === 1) return // 避免影响全局date
    const key = menu.key as DateType
    onChange(key)
    setGlobalDateType(key)
  }
  const currentLabel = useMemo(() => {
    const activeItem = items?.find((item) => item?.key === value) as any
    return activeItem?.label || defaultDateLabel[value]
  }, [items, value])
  return (
    <Dropdown trigger={['click']} menu={{ items, onClick: handleClick }}>
      <div className="bg-[url('/src/assets/images/menu-bg.png')] bg-center bg-no-repeat bg-cover h-34px lh-34px text-white px-5 text-base font-500 cursor-pointer">
        {currentLabel}
        <DownOutlined className="ml-1" />
      </div>
    </Dropdown>
  )
}

export const ContentTop = ({
  title = '我是标题',
  describe = '',
  onChangeDate,
  showMore = true,
  onMoreClick,
  dateValue = DateType.Yesterday,
  dateItems = [{ key: DateType.Yesterday, label: '昨日' }],
  tooltipProps = {}, // 顺便支持你之前想要的 Tooltip 宽度配置
}: {
  title?: string
  describe?: string | React.ReactNode
  onChangeDate?: (value: DateType) => void
  showMore?: boolean
  onMoreClick?: () => void
  dateValue?: DateType
  dateItems?: MenuProps['items']
  tooltipProps?: any
}) => {
  const handleMoreClick = () => {
    onMoreClick?.()
  }
  return (
    <div className="flex items-center content-box-top h-10">
      <CaretRightOutlined className="ml-1" />
      <div className="flex-1 content-box-top-title ml-1">
        {describe ? (
          <Tooltip
            title={describe}
            overlayInnerStyle={{
              width: 'max-content',
              minWidth: '300px',
              ...tooltipProps?.overlayInnerStyle,
            }}
            {...tooltipProps}
          >
            {title}
            <QuestionCircleFilled className="ml-6px text-#fff" />
          </Tooltip>
        ) : (
          title
        )}
      </div>
      <div className="flex items-center">
        <ContentSelect value={dateValue} onChange={onChangeDate!} items={dateItems} />

        {showMore ? (
          <span
            className="ml-6 text-[#93AADB] text-sm font-500 cursor-pointer"
            onClick={handleMoreClick}
          >
            {'查看更多>>'}
          </span>
        ) : null}
      </div>
    </div>
  )
}
