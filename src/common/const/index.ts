import dayjs from 'dayjs'

import {
  AssetModeType,
  DateType,
  type IEnumDescName,
  createEnumMap,
  transferMapToArr,
} from '../enum'

export const defaultDateValue = {
  [DateType.Today]: dayjs().format('YYYY-MM-DD'),
  [DateType.Yesterday]: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
}

export const defaultDateLabel = {
  [DateType.Today]: '今日',
  [DateType.Yesterday]: '昨日',
}

export const assetModeTypeMap = createEnumMap<any, IEnumDescName>([
  [AssetModeType.Markets, { name: '市场资产' }],
  [AssetModeType.Advertisin, { name: '广告资产' }],
  [AssetModeType.Business, { name: '商业地产' }],
  [AssetModeType.Base, { name: '基地资产' }],
  [AssetModeType.Land, { name: '土地资产' }],
] as any)

export const assetModeTypeOptions = transferMapToArr(assetModeTypeMap, (item: any) => item.name)

export const commonPagination = {
  showQuickJumper: true,
  showSizeChanger: true,
  pageSizeOptions: [10, 20, 50, 100],
  showTotal: (total: number) => `共 ${total} 条`,
}

export * from './coords‌'
