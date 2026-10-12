import Big from 'big.js'

// 整数显示整数，小数保留2位小数
export function formatNumber(
  num: number | string | null | undefined,
  decimals: number = 2,
): number {
  try {
    return Number(Big(num || 0).toFixed(decimals))
  } catch {
    return 0
  }
}
export function formatFixedNumber(num: number | string | null | undefined, decimals: number = 2) {
  try {
    return Big(num || 0).toFixed(decimals)
  } catch {
    return formatFixedNumber(0, decimals)
  }
}

/** 金额格式化 */
export function formatAmount(num: number | string, decimals: number = 2) {
  return formatFixedNumber(num, decimals)
}

/** 金额格式化成万元 */
export function formatWanYuan(num: number | string | null | undefined, decimals: number = 2) {
  num = formatNumber(num, decimals)
  return formatFixedNumber(num / 10000, decimals)
}

export function getSummaryNumber<T>(list: T[], key: keyof T, decimals: number = 2) {
  const sum: string | number = list.reduce((pre: number, cur: T) => {
    return Big(pre)
      .add((cur[key] ?? '0') as string)
      .toNumber()
  }, 0)
  if (Number.isNaN(sum)) return '--'

  return formatNumber(sum, decimals)
}

export function getTotalNumber<T>(list: T[], key: keyof T, decimals: number = 2) {
  const sum: string | number = list.reduce((pre: number, cur: T) => {
    return Big(pre)
      .add(cur[key] as string)
      .toNumber()
  }, 0)
  return formatNumber(sum, decimals)
}

// // 保留一位小数
// export function formatPercent(
//   num: number | string,
//   options?: { decimals?: number; showPercent?: boolean },
// ) {
//   const { decimals = 2, showPercent = true } = options || {}
//   return showPercent ? `${formatNumber(num, decimals)}%` : formatNumber(num, decimals)
// }

/**
 * 校验空值
 * @param {any} str
 * @returns {boolean} 是否为空值
 */
export function isEmpty(str: any): str is null | undefined | '' {
  return str === null || str === undefined || str === ''
}

/** 平米转成万平米 */
export function formatArea(num: number, precision: number = 2) {
  if (isEmpty(num) || num <= 0) return num

  return `${(num / 10000).toFixed(precision)}`
}

/** 平米转成亩 */
export function formatMu(num: number | undefined | null, precision: number = 5) {
  if (isEmpty(num) || num <= 0) return num

  return `${(num / 666.67).toFixed(precision)}`
}

/**
 * 计算两个数的百分比
 * @param numerator 分子 (number | string)
 * @param denominator 分母 (number | string)
 * @param decimals 小数位数 (number)，默认2位小数
 * @param defaultValue 分母为0时的默认值 (number)，默认0
 * @returns 百分比值和字符串对象 { num: number, str: string }
 */
export function calculatePercentage(
  numerator: number | string | null | undefined,
  denominator: number | string | null | undefined,
  decimals: number = 2,
  defaultValue: number = 0,
) {
  const format = (percentage: number | Big.Big) => {
    return {
      /** 通常为0-100的数字 */
      num: Number(percentage.toFixed(decimals)),
      str: `${percentage.toFixed(decimals)}%`,
    }
  }
  try {
    // 将输入转换为 Big 类型
    const num = Big(numerator || 0)
    const denom = Big(denominator || 0)

    // 检查分母是否为0
    // 计算百分比：(分子 / 分母) * 100
    const percentage = denom.eq(0) ? defaultValue : num.div(denom).times(100)

    return format(percentage)
  } catch {
    // 处理类型转换等异常情况
    return format(defaultValue)
  }
}

// 百分比格式化函数的重载签名
export function formatPercent<
  T extends number | boolean | undefined = undefined,
  U extends boolean | undefined = undefined,
>(
  num: number | string | null | undefined,
  decimals?: T,
  showPercent?: U,
): T extends false ? number : U extends false ? number : string
/**
 * 百分比格式化
 * @param num 要格式化的数字
 * @param decimals 小数位数 或 是否显示百分号
 * @param showPercent 是否显示百分号
 * @returns 格式化后的百分比字符串 或 数字
 */
export function formatPercent(
  num: number | string | null | undefined,
  decimals: number | boolean = 2,
  showPercent: boolean = true,
) {
  // 处理decimals表示是否显示百分号的情况
  if (typeof decimals === 'boolean') {
    showPercent = decimals
    decimals = 2
  }
  return showPercent ? `${formatFixedNumber(num, decimals)}%` : formatNumber(num, decimals)
}
