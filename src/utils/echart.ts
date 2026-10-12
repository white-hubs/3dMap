/**
 * ECharts tooltip 自动轮播配置
 * @param chart ECharts 实例
 * @param options 配置选项
 */
export interface TooltipAutoPlayOptions {
  /** 轮播间隔时间（毫秒），默认 3000 */
  interval?: number
  /** 数据系列索引，默认 0 */
  seriesIndex?: number
  /** 是否循环播放，默认 true */
  loop?: boolean
  /** 轮播开始时的回调 */
  onStart?: () => void
  /** 轮播结束时的回调 */
  onEnd?: () => void
  /** 每次轮播时的回调 */
  onPlay?: (currentIndex: number) => void
}

/**
 * ECharts tooltip 自动轮播类
 */
export class TooltipAutoPlay {
  private chart: any
  private options: Required<TooltipAutoPlayOptions>
  private currentIndex: number = -1 // 初始值为 -1，这样第一次轮播就是索引 0
  private timer: number | null = null
  private isPaused: boolean = false
  private dataLength: number = 0

  constructor(chart: any, options: TooltipAutoPlayOptions = {}) {
    this.chart = chart
    this.options = {
      interval: options.interval ?? 3000,
      seriesIndex: options.seriesIndex ?? 0,
      loop: options.loop ?? true,
      onStart: options.onStart ?? (() => {}),
      onEnd: options.onEnd ?? (() => {}),
      onPlay: options.onPlay ?? (() => {}),
    }
  }

  /**
   * 开始轮播
   */
  start() {
    if (this.timer) {
      this.stop()
    }

    this.isPaused = false
    const option = this.chart.getOption()
    console.log('获取到的 option:', option)

    const series = option.series[this.options.seriesIndex]
    console.log('获取到的 series:', series)

    if (!series) {
      console.warn('Series not found at index:', this.options.seriesIndex)
      return
    }

    // 尝试多种方式获取数据
    let data = series.data

    // 如果没有 data，尝试从 dataset 获取
    if (!data && option.dataset) {
      const dataset = Array.isArray(option.dataset) ? option.dataset[0] : option.dataset
      if (dataset && dataset.source) {
        data = dataset.source
      }
    }

    if (!data || data.length === 0) {
      console.warn('Series data not found or empty')
      return
    }

    this.dataLength = data.length
    console.log('数据长度:', this.dataLength)

    this.currentIndex = -1 // 从 -1 开始，这样第一次轮播就是索引 0
    this.options.onStart()
    this.play()
    this.bindEvents()
  }

  /**
   * 停止轮播
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.unbindEvents()
    this.isPaused = false
  }

  /**
   * 暂停轮播
   */
  pause() {
    this.isPaused = true
  }

  /**
   * 恢复轮播
   */
  resume() {
    this.isPaused = false
  }

  /**
   * 执行轮播
   */
  private play() {
    // 清除之前的定时器
    if (this.timer) {
      clearInterval(this.timer)
    }

    this.timer = window.setInterval(() => {
      // 添加调试信息
      // console.log('轮播执行中...', {
      //   isPaused: this.isPaused,
      //   currentIndex: this.currentIndex,
      //   dataLength: this.dataLength,
      // })

      if (this.isPaused) {
        // console.log('轮播已暂停，跳过')
        return
      }

      // 先递增索引
      this.currentIndex++

      // 检查是否需要重置或停止
      if (this.currentIndex >= this.dataLength) {
        if (this.options.loop) {
          this.currentIndex = 0
          // console.log('轮播循环重置为 0')
        } else {
          this.stop()
          this.options.onEnd()
          // console.log('轮播结束')
          return
        }
      }

      // console.log('显示 tooltip，当前索引:', this.currentIndex);

      // 显示当前索引的 tooltip
      this.showTooltip()
      this.options.onPlay(this.currentIndex)
    }, this.options.interval)
  }

  /**
   * 显示 tooltip
   */
  private showTooltip() {
    this.chart.dispatchAction({
      type: 'showTip',
      seriesIndex: this.options.seriesIndex,
      dataIndex: this.currentIndex,
    })
  }

  /**
   * 绑定事件
   */
  private bindEvents() {
    // 使用更精确的事件监听，避免误触发
    this.chart.getZr().on('mousemove', this.handleMouseMove)
    this.chart.getZr().on('click', this.handleClick)
    this.chart.getZr().on('globalout', this.handleGlobalOut)
  }

  /**
   * 解绑事件
   */
  private unbindEvents() {
    this.chart.getZr().off('mousemove', this.handleMouseMove)
    this.chart.getZr().off('click', this.handleClick)
    this.chart.getZr().off('globalout', this.handleGlobalOut)
  }

  /**
   * 鼠标移动事件处理
   */
  private handleMouseMove = () => {
    if (!this.isPaused) {
      this.pause()
    }
  }

  /**
   * 点击事件处理
   */
  private handleClick = () => {
    if (!this.isPaused) {
      this.pause()
    }
  }

  /**
   * 鼠标移出事件处理
   */
  private handleGlobalOut = () => {
    if (this.isPaused) {
      this.resume()
    }
  }
}

/**
 * 为 ECharts 实例启用 tooltip 自动轮播
 * @param chart ECharts 实例
 * @param options 配置选项
 * @returns TooltipAutoPlay 实例
 */
export function enableTooltipAutoPlay(
  chart: any,
  options?: TooltipAutoPlayOptions,
): TooltipAutoPlay {
  const autoPlay = new TooltipAutoPlay(chart, options)
  autoPlay.start()
  return autoPlay
}
