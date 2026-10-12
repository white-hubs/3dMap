/**
 * 系统参数
 */
export interface SystemState {
  name: string
  httpCode: {
    success: number
    error: number
  }
  pager: {
    PAGE_KEY: string
    SIZE_KEY: string
    TOTAL_PATH: string
    LIST_PATH: string
  }
  defaultToken: string
  prefix: {
    assetManageReport: string
    dbcPermission: string
    dbcMember: string
  }
}

const System: SystemState = {
  name: '深农聚合数字管理平台',
  // 分页字段对应关系
  pager: {
    // 入参，当前页字段
    PAGE_KEY: 'pageNum',
    // 入参，当前条数字段
    SIZE_KEY: 'pageSize',
    // 后台返回总条数路径
    TOTAL_PATH: 'data.total',
    // 后台返回列表路径
    LIST_PATH: 'data.list',
  },
  httpCode: {
    success: 1,
    error: 0,
  },
  defaultToken: 'c2hiaTpzZWNyZXQ=',
  prefix: {
    assetManageReport: 'assetmanagereport',
    dbcPermission: 'dbcpermission',
    dbcMember: 'dbcmember',
  },
}

export default System
