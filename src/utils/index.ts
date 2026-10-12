import CryptoJS from 'crypto-js'

export function generateUUID() {
  // 生成16字节的随机数据
  const randomBytes = CryptoJS.lib.WordArray.random(16)

  // 转换为十六进制字符串并格式化为UUIDv4样式
  const hexString = randomBytes.toString(CryptoJS.enc.Hex).toUpperCase()

  // 插入连字符以匹配UUID格式
  const uuid = hexString.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5')

  return uuid
}

/**
 * 获取对象路径类型的辅助工具
 */
type GetFieldType<Obj, Path> = Path extends `${infer Left}.${infer Right}`
  ? Left extends keyof Obj
    ? GetFieldType<Obj[Left], Right>
    : undefined
  : Path extends keyof Obj
    ? Obj[Path]
    : undefined

/**
 * 核心实现
 */
export function get<T extends object, P extends string, D = undefined>(
  object: T,
  path: P,
  defaultValue?: D,
): GetFieldType<T, P> | D {
  // 将 a[0].b 转换为 a.0.b
  const keys = path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean)

  let result: any = object

  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue as D
    }
    result = result[key]
  }

  return (result === undefined ? defaultValue : result) as GetFieldType<T, P> | D
}

/**
 * 校验空值
 * @param {any} str
 * @returns {boolean} 是否为空值
 */
export function isEmpty(str: any): str is null | undefined | '' {
  return str === null || str === undefined || str === ''
}

/**
 * 带有层级关系的列表转成树数据
 * @param {any[]} nodes
 * @returns {any[]} treeData
 */
export function convertArrayToTree(nodes: any[]) {
  const map: any = {}
  nodes.forEach((node) => {
    map[node.oid] = { ...node, children: [] }
  })
  const tree = nodes.reduce((acc: any[], node) => {
    if (node.parent === null)
      // || !Object.prototype.hasOwnProperty.call(map, node.parent) || !Object.prototype.hasOwnProperty.call(map, node.oid)
      acc.push(map[node.oid])
    else map[node.parent].children.push(map[node.oid])

    return acc
  }, [])

  return tree
}

/**
 * 递归修改树的每一个节点数据，然后可过滤不需要的节点
 * @param {Array} list 树数据
 * @param {Function} callback 回调方法，参数为当前节点拷贝的数据对象（此时该节点的子节点已是修改后的数据了）、当前层级和父级（第一级没有），返回修改后的数据对象
 * @param {string} childKey 子级数据的key，用于递归遍历，默认为'children'
 * @param {Function} filterFn 过滤子节点方法，参数为修改后的数据对象，返回true则保留该节点，返回false则过滤该节点（不传则不执行过滤）
 * @returns {Array} 修改后的新的树数据
 */
export function modifyTreeData(
  list: any[] | null | undefined,
  callback: (item: any, level: number, parent?: any) => Record<string, any>,
  childKey = 'children',
  filterFn?: (item: any) => boolean,
) {
  function modifyData(list: any[], level: number = 1, parent?: any) {
    const newList = list.map((item) => {
      const children: any =
        item[childKey] && item[childKey].length ? modifyData(item[childKey], level + 1, item) : null
      return callback({ ...item, [childKey]: children }, level, parent)
    })
    return filterFn ? newList.filter(filterFn) : newList
  }
  return modifyData(list ?? [])
}

/**
 * 将树数据转换成hashTable形式，方便查找子数据
 * @param {Array} list 树数据
 * @param {string} key 唯一的值作为哈希表的属性，默认为'oid'
 * @param {string} childKey 子级数据的key，用于递归遍历，默认为'children'
 * @returns {object} 转换后的hashTable
 */
export function convertTreeDataToHash(
  list: any[] | null | undefined,
  key = 'oid',
  childKey = 'children',
) {
  const json: Record<string, any> = {}
  function listToHash(list: any[] | null | undefined) {
    list?.forEach((item) => {
      json[item[key]] = item
      listToHash(item[childKey])
    })
  }
  listToHash(list)
  return json
}

/**
 * 深度合并两个对象
 * @param target 目标对象（基础配置）
 * @param source 来源对象（外部传入的覆盖配置）
 */
export function deepMerge(target: any, source: any) {
  if (!source) return target

  const result = { ...target }

  Object.keys(source).forEach((key) => {
    const targetValue = result[key]
    const sourceValue = source[key]

    if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
      // 针对 ECharts series 等数组，通常采取索引合并或直接替换
      // 这里采用简单的索引合并方案
      result[key] = sourceValue.map((item, index) =>
        typeof item === 'object' && item !== null
          ? deepMerge(targetValue[index] || {}, item)
          : item,
      )
    } else if (
      typeof targetValue === 'object' &&
      targetValue !== null &&
      typeof sourceValue === 'object' &&
      sourceValue !== null
    ) {
      // 递归合并对象
      result[key] = deepMerge(targetValue, sourceValue)
    } else {
      // 基本类型直接覆盖
      result[key] = sourceValue
    }
  })

  return result
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}
