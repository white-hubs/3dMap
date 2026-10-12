import { Flex, Progress, type ProgressProps } from 'antd'

import { isEmpty } from '@/utils'

export interface IContentProgressItem {
  label: string | React.ReactNode
  value: string | React.ReactNode
  unit?: string | React.ReactNode
  indicatorName?: string | React.ReactNode
  hideIndicatorName?: boolean
  indicatorValue?: number
  indicatorUnit?: string | React.ReactNode
  extra?: string | React.ReactNode
  status?: ProgressProps['status']
  percent: number
  percentage?: boolean
}

const classNames: ProgressProps['classNames'] = {
  root: 'demo-progress-root',
  rail: 'demo-progress-rail',
  track: 'demo-progress-track',
}

const stylesFn: ProgressProps['styles'] = (info) => {
  const status = info?.props?.status ?? 'normal'
  return {
    track: {
      background: 'none',
      backgroundImage:
        status === 'exception'
          ? `
      linear-gradient(
          to right,
          rgba(254,115,115,0.2) 0%,
          rgba(254,76,76,0.8) 100%
        )
      `
          : `
        linear-gradient(
          to right,
          rgba(47,101,206,0.2),
          #2A72FF
        )`,
      borderRadius: 6,
      transition: 'all 0.3s ease',
    },
    rail: {
      backgroundColor: 'rgba(144,180,241,0.2)',
      borderRadius: 6,
    },
  } satisfies ProgressProps['styles']
}

export const ContentItemProgress = ({ percent = 80, status = 'normal' }: ProgressProps) => {
  return (
    <Progress
      status={status}
      classNames={classNames}
      styles={stylesFn}
      percent={percent}
      showInfo={false}
    />
  )
}

const ContentProgress: React.FC<{
  data: IContentProgressItem[]
  percentage?: boolean
  gap?: number
}> = ({ data, percentage = false, gap = 20 }) => {
  return (
    <div className="flex flex-col" style={{ gap: gap + 'px' }}>
      {data.map((item, index) => (
        <div key={index} className="text-0">
          <Flex align="center" justify="space-between" className="mb-6px">
            <Flex align="center">
              <div
                className={`w-24px h-24px text-18px flex flex-center border border-solid border-[#3B6DD5] ${item.status === 'exception' ? 'border-#FE4C4C!' : ''}`}
              >
                {index + 1}
              </div>
              <div className="text-18px ml-3">{item.label}</div>
            </Flex>
            <Flex
              align="center"
              className={`text-white ${item.status === 'exception' ? 'text-#FF2525!' : ''}`}
            >
              {item.indicatorName ? (
                <div
                  className="mr-16px whitespace-nowrap text-16px"
                  style={{
                    color: percentage
                      ? !isEmpty(item.indicatorValue) && item.indicatorValue >= 0
                        ? '#FF2525'
                        : '#01A44F'
                      : '',
                  }}
                >
                  {item.hideIndicatorName ? null : <span>{item.indicatorName}</span>}
                  <span className={`ml-5px ${percentage ? '' : 'text-24px'}`}>
                    {percentage
                      ? !isEmpty(item.indicatorValue) && item.indicatorValue >= 0
                        ? '+'
                        : ''
                      : ''}
                    {item.indicatorValue}
                  </span>
                  <span>{item.indicatorUnit}</span>
                </div>
              ) : null}
              <Flex align="baseline">
                <div className="text-24px">{item.value}</div>
                <div className="text-16px">{item.unit}</div>
              </Flex>
              {item.extra ? <div className="text-16px ml-5px">{item.extra}</div> : null}
            </Flex>
          </Flex>
          <ContentItemProgress {...item} />
        </div>
      ))}
    </div>
  )
}

export default ContentProgress
