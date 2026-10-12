import { ICON_MAP } from '@/common/const/coords‌'

import './label.scss'

const ChinaLabel = ({ labelData }: { labelData: any[] }) => {
  return (
    <div className="pointer-events-auto bg-[#01173F] border border-[#2F65CE] p-4 min-w-200px shadow-[0_0_15px_rgba(42,114,255,0.5)] animate-glow-border">
      <div className="flex justify-between items-center">
        <div className="text-white text-lg font-bold">{labelData?.[0]?.name}</div>
        <div className="close-btn">×</div>
      </div>
      {/* 装饰小三角：指向左侧图标 */}
      <div
        className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-0 h-0 
            border-t-[8px] border-t-transparent 
            border-b-[8px] border-b-transparent 
            border-r-[8px] border-r-[#01173F]"
      ></div>
      <div className="mt-2">
        {labelData?.map((item: any, i: number) => (
          <div key={i} className="py-1 text-white text-sm  border-white">
            <img src={ICON_MAP[item.type]} className="inline-block w-4 h-4 mr-2" />
            {item.name}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ChinaLabel
