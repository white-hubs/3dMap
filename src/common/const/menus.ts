export const menus = [
  { label: '资产总览', path: '/overview', code: 'Button-GroupBIOverview' },
  {
    label: '资产台账',
    path: '/ledger',
    code: 'Button-GroupBILedger',
    children: [
      { label: '市场资产', path: '/ledger/market', code: 'Button-GroupBILedgerMarket' },
      { label: '商业地产', path: '/ledger/business', code: 'Button-GroupBILedgerBusiness' },
      // { label: '基地资产', path: '/ledger/base' },
      // { label: '土地资产', path: '/ledger/land' },
    ],
  },
  {
    label: '资产经营',
    path: '/assets',
    code: 'Button-GroupBIAssets',
    children: [
      {
        label: '资产租赁',
        path: '/assets/lease',
        code: 'Button-GroupBIAssetsLease',
        children: [
          {
            label: '市场资产',
            path: '/assets/lease/market',
            code: 'Button-GroupBIAssetsLeaseMarket',
          },
          {
            label: '商业地产',
            path: '/assets/lease/business',
            code: 'Button-GroupBIAssetsLeaseBusiness',
          },
          // { label: '基地资产', path: '/assets/lease/base' },
          // { label: '土地资产', path: '/assets/lease/land' },
        ],
      },
      { label: '资产应收', path: '/assets/revenue', code: 'Button-GroupBIAssetsRevenue' },
    ],
  },
  {
    label: '风控管理',
    path: '/risk/analysis',
    code: 'Button-GroupBIRisk',
    children: [
      // { label: '资产总览', path: '/risk/overview' },
      // { label: '风控分析', path: '/risk/analysis' },
    ],
  },
]
