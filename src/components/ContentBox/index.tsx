import { Flex, type MenuProps } from 'antd'

import { DateType } from '@/common/enum'

import { ContentTop } from './ContentTop'
import './index.css'

interface ContentBoxProps {
  title?: string
  describe?: string | React.ReactNode
  children?: React.ReactNode
  onChangeDate?: (value: DateType) => void
  showMore?: boolean
  onMoreClick?: () => void
  dateValue?: DateType
  dateItems?: MenuProps['items']
}

const ContentBox: React.FC<ContentBoxProps> = ({
  title,
  describe,
  children,
  onChangeDate,
  showMore,
  onMoreClick,
  dateValue,
  dateItems,
}) => {
  return (
    <Flex className="flex-full pointer-events-auto" vertical>
      {title && (
        <ContentTop
          title={title}
          describe={describe}
          showMore={showMore}
          onChangeDate={onChangeDate}
          onMoreClick={onMoreClick}
          dateValue={dateValue}
          dateItems={dateItems}
        />
      )}
      {children}
    </Flex>
  )
}

export default ContentBox
