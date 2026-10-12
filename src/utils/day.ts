import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import arraySupport from 'dayjs/plugin/arraySupport'

dayjs.locale('zh-cn')
dayjs.extend(arraySupport)

export default dayjs
export const DATE_FORMAT = 'YYYY-MM-DD'
export const TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss'
export const TIME_START_FORMAT = 'YYYY-MM-DD 00:00:00'
export const TIME_END_FORMAT = 'YYYY-MM-DD 23:59:59'
export const MINUTE_FORMAT = 'YYYY-MM-DD HH:mm'
export const ONE_DAY_SECOND = 24 * 60 * 60 * 1000 // 一天的毫秒数

// https://day.js.org/docs/zh-CN/get-set/day
// 获取日期的周一至周日
export function getDayWeeks(day: dayjs.ConfigType, format = DATE_FORMAT) {
  day = dayjs(day)
  return [day.day(1).format(format), day.day(7).format(format)]
}
// https://day.js.org/docs/zh-CN/manipulate/start-of
// 获取日期的 月初至月末
export function getDayMonths(day: dayjs.ConfigType, format = DATE_FORMAT) {
  day = dayjs(day)
  return [
    day.startOf('month').format(DATE_FORMAT),
    day.endOf('month').format(format),
  ]
}

export function dayFormat(day: dayjs.ConfigType, format = DATE_FORMAT) {
  return dayjs(day).format(format)
}

export function timeFormat(time: dayjs.ConfigType, format = TIME_FORMAT) {
  return dayjs(time).format(format)
}

// 获取一个月的天数
export function getMonthDaysCount(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

// 获取当前时间
export function getCurrentTime() {
  return timeFormat(dayjs())
}

// 获取近七天时间范围
export function getPassSevenDays(): string[] {
  // 获取今天
  const endDate: dayjs.Dayjs = dayjs()
  // 过去七天
  const startDate: dayjs.Dayjs = endDate.subtract(6, 'day')

  return [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')]
}
// 获取过去365天（一年）时间数组
export function getPassYearDays(): string[] {
  const years: string[] = []
  for (let i = 0; i < 365; i++)
    years.push(dayjs().subtract(i, 'day').format('YYYY年MM月DD日'))

  return years
}
// 获取当前小时
export function getCurrentHour(): number {
  // 创建一个 Dayjs 对象来表示当前日期和时间
  const now: dayjs.Dayjs = dayjs()

  // 通过调用 `hour()` 函数获取当前小时
  const currentHour: number = now.hour()
  return currentHour
}

// 获取默认最大日期和最小日期 一年前-至今
export function getDefaultMinMaxDate() {
  const today = dayjs()
  return [today.subtract(1, 'year').toDate(), today.toDate()]
}

// 默认查询日期
export function getDefaultTimeRange(startTime?: dayjs.ConfigType, endTime?: dayjs.ConfigType): [string, string] {
  // 默认当天
  return [dayjs(startTime).format(TIME_START_FORMAT), dayjs(endTime).format(TIME_END_FORMAT)]
}

// 禁用日期选择最近一年
export function disabledDate(current: dayjs.Dayjs) {
  return current && current > dayjs().endOf('day')
}
