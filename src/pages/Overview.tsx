import GridLayout from '@/components/GridLayout'

const Overview = () => {
  return (
    <>
      <div className="h-full w-full">
        {/* 定义 12 列网格 (常用标准)
        行高定义为: 顶部 120px，中间自适应 1fr，底部 200px
      */}
        <GridLayout cols={12} rows={20} gap={16} className="flex-1">
          <></>
        </GridLayout>
      </div>
    </>
  )
}

export default Overview
