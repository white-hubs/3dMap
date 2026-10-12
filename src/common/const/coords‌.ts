import baseIcon from '@/assets/icons/base-icon.png'
import cityIcon from '@/assets/icons/city-icon.png'
import partyFoundingIcon from '@/assets/icons/party-founding-icon.png'
import partyFoundingOperateGreenIcon from '@/assets/icons/party-founding-operate-icon-green.png'

import { AssetMapCompanyType } from '../enum'

const excludeIds = ['1007', '1057', '1002']

function deepFilter(data: any) {
  return data
    .filter((item: any) => !excludeIds.includes(item.id)) // 过滤当前层
    .map((item: any) => {
      if (item.children) {
        // 如果有子集，递归过滤子集
        return { ...item, children: deepFilter(item.children) }
      }
      return item
    })
}

// 市场资产地图坐标点数据
export const mapData: any[] = [
  {
    name: '武汉东',
    id: '1050',
    value: [114.43, 30.49, 100],
    type: AssetMapCompanyType.PartyFounding,
  },
  {
    name: '成都农批',
    id: '1004',
    value: [104.115479, 30.944002, 100],
    type: AssetMapCompanyType.PartyFounding,
  },
  {
    name: '蚌埠海吉星',
    id: '1003',
    value: [117.39, 32.98, 100],
    type: AssetMapCompanyType.PartyFoundingOperate,
  },
  {
    name: '九江市场',
    id: '1005',
    value: [116.0, 29.68, 100],
    type: AssetMapCompanyType.PartyFoundingOperate,
  },
  {
    name: '长沙海吉星',
    id: '1006',
    value: [113.15, 28.13, 100],
    type: AssetMapCompanyType.PartyFounding,
  },
  {
    name: '惠州海吉星',
    id: '1010',
    value: [114.43, 23.13, 100],
    type: AssetMapCompanyType.PartyFounding,
  },
  {
    name: '广西海吉星',
    id: '1007',
    value: [108.27, 22.78, 100],
    type: AssetMapCompanyType.PartyFounding,
  },
  {
    name: '安庆海吉星',
    id: '1023',
    value: [117.06, 30.57, 100],
    type: AssetMapCompanyType.PartyFoundingOperate,
  },
  {
    name: '沈阳海吉星',
    id: '1049',
    value: [123.58, 41.95, 100],
    type: AssetMapCompanyType.PartyFounding,
  },
  {
    name: '上农批',
    id: '1012',
    value: [121.56, 31.16, 100],
    type: AssetMapCompanyType.PartyFounding,
  },
  {
    name: '南昌农批',
    id: '1011',
    value: [115.71, 28.62, 100],
    type: AssetMapCompanyType.PartyFounding,
  },
  {
    name: '西安市场',
    id: '1013',
    value: [109.0, 34.28, 100],
    type: AssetMapCompanyType.PartyFounding,
  },
  {
    name: '天津海吉星',
    id: '1019',
    value: [116.98, 38.96, 100],
    type: AssetMapCompanyType.PartyFoundingOperate,
  },
  {
    name: '宁夏海吉星',
    id: '1026',
    value: [106.33, 38.58, 100],
    type: AssetMapCompanyType.PartyFoundingOperate,
  },
  {
    name: '岳阳海吉星',
    id: '1024',
    value: [113.17, 29.43, 100],
    type: AssetMapCompanyType.PartyFounding,
  },
  {
    name: '新柳邕海吉星',
    id: '1008',
    value: [109.34, 24.29, 100],
    type: AssetMapCompanyType.PartyFounding,
  },
  {
    name: '长春海吉星',
    id: '1018',
    value: [125.19, 43.94, 100],
    type: AssetMapCompanyType.PartyFounding,
  },
  {
    name: '武汉海吉星',
    id: '1025',
    value: [114.27, 30.31, 100],
    type: AssetMapCompanyType.PartyFounding,
  },
  {
    name: '天津韩家墅海吉星农产品物流有限公司',
    id: '1002',
    value: [117.1, 39.21],
    type: AssetMapCompanyType.PartyFounding,
  },
  {
    name: '深圳市',
    value: [114.06, 22.54],
    type: AssetMapCompanyType.City,
    children: [
      {
        name: '深圳海吉星',
        id: '1001',
        value: [114.16, 22.65, 100],
        type: AssetMapCompanyType.PartyFounding,
      },
      {
        name: '光明海吉星',
        id: '1027',
        value: [113.87, 22.77, 100],
        type: AssetMapCompanyType.PartyFounding,
      },
      {
        name: '福田农批',
        id: '1016',
        value: [114.04, 22.56, 100],
        type: AssetMapCompanyType.PartyFounding,
      },
      {
        name: '南山农批',
        id: '1009',
        value: [113.92, 22.55, 100],
        type: AssetMapCompanyType.PartyFounding,
      },
      {
        name: '布吉农批',
        id: '1020',
        value: [114.12, 22.58, 100],
        type: AssetMapCompanyType.PartyFounding,
      },
      {
        name: '布吉海鲜',
        id: '1022',
        value: [114.12, 22.61, 100],
        type: AssetMapCompanyType.PartyFounding,
      },
      {
        name: '南方物流',
        id: '1051',
        value: [116.66, 39.89, 100],
        type: AssetMapCompanyType.PartyFounding,
      },
      {
        name: '集贸市场',
        id: '1030',
        value: [116.34, 39.81, 100],
        type: AssetMapCompanyType.PartyFounding,
      },
      {
        name: '深圳市深农置地商业运营管理有限公司',
        id: '1057',
        value: [114.17, 22.65],
        type: AssetMapCompanyType.PartyFounding,
      },
      {
        name: '深圳市运通致远冷链管理有限责任公司',
        id: '1070',
        value: [114.16, 22.64],
        type: AssetMapCompanyType.PartyFounding,
      },
      {
        name: '产业公司',
        id: '1071',
        value: [116.34, 39.81, 100],
        type: AssetMapCompanyType.Base,
      },
      {
        name: '果菜公司',
        id: '1048',
        value: [114.06, 22.74],
        type: AssetMapCompanyType.Base,
      },
    ],
  },
]

// 建档企业
export const foundingMapData = deepFilter(mapData)

// 经营企业
export const operationMapData = mapData.filter(
  (item) => item.type === AssetMapCompanyType.PartyFoundingOperate,
)

// 商业地产地图坐标点数据
export const busMapData: any = [
  {
    name: '广西海吉星',
    id: '1007',
    value: [108.27, 22.78, 100],
    type: AssetMapCompanyType.PartyFounding,
  },
  {
    name: '深圳市深农置地商业运营管理有限公司',
    id: '1057',
    value: [114.17, 22.65],
    type: AssetMapCompanyType.PartyFounding,
  },
  {
    name: '果菜公司',
    id: '1048',
    value: [114.06, 22.74],
    type: AssetMapCompanyType.PartyFounding,
  },
  {
    name: '新柳邕海吉星',
    id: '1008',
    value: [109.34, 24.29, 100],
    type: AssetMapCompanyType.PartyFounding,
  },
  {
    name: '天津韩家墅海吉星农产品物流有限公司',
    id: '1002',
    value: [117.1, 39.21],
    type: AssetMapCompanyType.PartyFounding,
  },
  {
    name: '南昌农批',
    id: '1011',
    value: [115.71, 28.62, 100],
    type: AssetMapCompanyType.PartyFounding,
  },
]

export const mapDataConfig: any = {
  '/overview': mapData,
  '/risk/analysis': operationMapData,
  '/ledger/market': foundingMapData,
  '/ledger/business': busMapData,
  '/assets/lease/market': operationMapData,
  '/assets/lease/business': operationMapData,
  '/assets/revenue': operationMapData,
}

export const ICON_MAP: Record<string, string> = {
  [AssetMapCompanyType.Base]: baseIcon, // 基地企业
  [AssetMapCompanyType.PartyFoundingOperate]: partyFoundingOperateGreenIcon, // 建档及经营
  [AssetMapCompanyType.PartyFounding]: partyFoundingIcon, // 建档企业
  [AssetMapCompanyType.City]: cityIcon, // 城市企业
}

export const BGCOLOR_MAP: Record<string, string> = {
  [AssetMapCompanyType.Base]: 'rgba(0, 88, 255, 0.80)', // 基地企业
  [AssetMapCompanyType.PartyFoundingOperate]: 'rgba(1, 164, 79, 0.80)', // 建档及经营
  [AssetMapCompanyType.PartyFounding]: 'rgba(7, 92, 212, 0.80)', // 建档企业
  [AssetMapCompanyType.City]: 'rgba(255, 179, 32, 0.80)', // 城市企业
}
export const NAME_MAP: Record<string, string> = {
  [AssetMapCompanyType.Base]: '基地企业', // 基地企业
  [AssetMapCompanyType.PartyFoundingOperate]: '建档及经营企业', // 建档及经营
  [AssetMapCompanyType.PartyFounding]: '建档企业', // 建档企业
}

export const ORDER_MAP: Record<string, number> = {
  [AssetMapCompanyType.PartyFounding]: 1,
  [AssetMapCompanyType.PartyFoundingOperate]: 2,
  [AssetMapCompanyType.Base]: 3,
  // 后续新增类型直接往后排
}
