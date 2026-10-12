import { useCallback, useEffect, useState } from 'react'

import type { PaginationProps } from 'antd/es/pagination'

import { get } from '@/utils/index'
import type { FetchResponse } from '@/utils/request'
import System from '@/utils/system'

const { PAGE_KEY, SIZE_KEY, TOTAL_PATH, LIST_PATH } = System.pager

const defaultPagination = {
  current: 1,
  total: 0,
  showQuickJumper: true,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '30', '40', '50', '100'],
  pageSize: 10,
}

const defaultParams = {
  [PAGE_KEY]: 1,
  [SIZE_KEY]: +defaultPagination.pageSizeOptions[0],
}

export interface UseTableProps<T> {
  request: (params?: T) => Promise<FetchResponse>
  el?: string
  listPath?: string
  totalPath?: string
  hasPagination?: boolean
  immediate?: boolean
}

export const useTable = <ParamsType>({
  request,
  el = '.ant-table',
  listPath,
  totalPath,
  hasPagination = true,
  immediate = true,
}: UseTableProps<ParamsType>) => {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState([])
  const [total, setTotal] = useState(0)
  const [curPage, setCurPage] = useState(1)
  const [params, setParams] = useState<ParamsType | Record<string, any>>({ ...defaultParams })
  const [pagination, setPagination] = useState<PaginationProps | false>({})

  const fetchDataCallback = useCallback(() => {
    const t = document.querySelector(el)
    const tb = t ? t.querySelector('.ant-table-body') : null
    if (tb) {
      tb.scrollTop = 0
    }
  }, [el])

  const fetchData = useCallback(
    async (_params = {}, cb?: (items?: [], sum?: number) => void) => {
      try {
        if (typeof request !== 'function') {
          throw new Error('request is not a function')
        }
        const p: ParamsType = Object.assign(hasPagination ? { ...defaultParams } : {}, _params)
        setLoading(true)
        setParams(p)
        const res = await request(p)
        const typedP = p as d<string, any>
        const items: any = ((get(res, listPath || LIST_PATH, []) as any[]) || []).map(
          (v: { index?: number }, i: number) => {
            const idx = (typedP[PAGE_KEY] - 1) * typedP[SIZE_KEY] + i + 1
            v.index = v.index || idx || i
            return v
          },
        )
        const sumValue = get(res, totalPath || TOTAL_PATH, 0)
        const sum: number = sumValue || 0
        setLoading(false)
        setDataSource(items)
        setTotal(sum)
        fetchDataCallback()
        if (typeof cb === 'function') {
          cb(items, sum)
        }
      } catch (error: any) {
        // error
        console.error(error)
        setLoading(false)
      }
    },
    [request, fetchDataCallback, hasPagination, listPath, totalPath],
  )

  const onChange = useCallback(
    (page: number) => {
      setCurPage(page)
      fetchData({ ...params, [PAGE_KEY]: page })
    },
    [params, fetchData],
  )

  const onShowSizeChange = useCallback(
    (page: number, size: number) => {
      defaultPagination.pageSize = size
      setCurPage(1)
      fetchData({ ...params, [PAGE_KEY]: 1, [SIZE_KEY]: size })
    },
    [params, fetchData],
  )

  useEffect(() => {
    if (hasPagination) {
      setPagination({
        ...defaultPagination,
        current: curPage,
        onChange,
        onShowSizeChange,
        total,
        showTotal: (sum: any) => `Total ${sum} items`,
      })
    } else {
      setPagination(false)
    }
  }, [onChange, onShowSizeChange, total, curPage, hasPagination])

  useEffect(() => {
    if (immediate) {
      fetchData()
    }
    return () => {
      setDataSource([])
      setParams({})
      setPagination({})
    }
  }, [])

  return {
    rowKey: 'oid',
    loading: {
      delay: 100,
      spinning: loading,
    },
    pagination,
    dataSource,
    setDataSource,
    params,
    fetchData,
  }
}
