/** 市场id映射 */
export enum EMarket {
  /** 南昌市场 */
  NanChang = '1011',
  /** 上海市场 */
  ShangHai = '1012',
  /** 长沙市场 */
  ChangSha = '1006',
  /** 惠州市场 */
  HuiZhou = '1010',
  /** 柳州市场 */
  LiuZhou = '1008',
  /** 西安市场 */
  XiAn = '1013',
  /** 南山市场 */
  NanShan = '1009',
  /** 天津静海市场 */
  JingHai = '1019',
  /** 武汉海吉星 */
  WuHan = '1025',
  /** 蚌埠市场 */
  BengBu = '1003',
  /** 九江市场 */
  JiuJiang = '1005',
  /** 成都市场 */
  ChengDu = '1004',
  /** 湖南岳阳市场 */
  YueYang = '1024',
  /** 大白菜 */
  Dbc = '1014',
  /** 深农集团 */
  SN = '1',
}

/** 网站服务端枚举，该类型尽量必传，不给默认值 */
export enum EWebsiteTerminal {
  /** 集团端 */
  Group = 'group',
  /** 市场端 */
  Market = 'market',
}

// 建档大类枚举
export enum AssetModeType {
  Markets = 'MARKETS', // 市场资产
  Advertisin = 'ADVERTISIN', // 市场资产-广告位资产
  Base = 'BASE', // 基地资产
  Cooperate = 'COOPERATE', // 基地资产-合作基地
  Farmhouse = 'FARMHOUSE', //  基地资产-农舍
  Business = 'BUSINESS', // 商业地产
  Land = 'LAND', // 土地资产
}

// 资产地图企业类型
export enum AssetMapCompanyType {
  PartyFounding = 'PARTYFOUNDING', // 建档企业
  Base = 'BASE', // 基地企业
  PartyFoundingOperate = 'PARTYFOUNDINGOPERATE', // 建档及经营
  City = 'CITY', // 城市企业
}

// 今日/昨日
export enum DateType {
  Today = 'TODAY', // 今日
  Yesterday = 'YESTERDAY', // 昨日
}

export type ValueOf<T> = T[keyof T]
type DefaultOptionTypeValueItem = string | number

export interface ISelectOption<T = DefaultOptionTypeValueItem> {
  label: string
  value: T
}

/** 枚举值对应中文描述 */
export interface IEnumDescName {
  name: string
}
/** 枚举值对应颜色描述 */
export interface IEnumDescColor {
  color: string
}

/** 枚举值对应icon描述 */
export interface IEnumDescIcon {
  icon: string
}

/** 辅助类型，获取枚举的值类型 */
type EnumValues<T extends Record<string, string | number>> = T[keyof T]
/** 辅助类型，将联合类型转换为交叉类型 */
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
  ? I
  : never
/** 辅助类型，获取联合类型的最后一个元素 */
type LastOf<U> =
  UnionToIntersection<U extends any ? () => U : never> extends () => infer R ? R : never
/** 辅助类型，将联合类型转换为元组类型 */
type UnionToTuple<U, L = LastOf<U>> = [U] extends [never] ? [] : [...UnionToTuple<Exclude<U, L>>, L]
/** 改进后的辅助类型，生成包含枚举所有值的固定长度元组 */
type EnumEntries<T extends Record<string, string | number>, K> = UnionToTuple<
  { [P in keyof T]: [T[P], K] }[keyof T]
>
/**
 * 生成Map函数，支持类型安全检查
 * @param entries 包含枚举值和描述的元组数组，注意顺序必须与枚举定义一致
 * @returns Map对象，键为枚举值，值为描述
 */
export function createEnumMap<T extends Record<string, string | number>, K>(
  entries: EnumEntries<T, K>,
): Map<EnumValues<T>, K> {
  // 使用类型断言告诉 TypeScript entries 是有效的 Map 构造函数参数
  return new Map<EnumValues<T>, K>(entries as Iterable<readonly [EnumValues<T>, K]>)
}
/** 将Map对象转为下拉框数据 */
export function transferMapToArr<T extends string | number, R>(
  map: Map<T, R>,
  predicate: (value: R) => string,
): ISelectOption<T>[] {
  return Array.from(map.entries()).map(([value, item]) => ({ value, label: predicate(item) }))
}
