/**
 * 代理数据
 * @param {*} props
 * @param {*} self this
 */
export class ProxyData {
  constructor(props, self) {
    Object.keys(props).forEach((key) => {
      let prop = props[key]
      let value = prop.default
      self[key] = value
      Object.defineProperty(self, key, {
        get() {
          return value
        },
        set(newVal) {
          prop.default = newVal
          prop.onChange && prop.onChange(newVal, self)
        },
      })
    })
  }
}
