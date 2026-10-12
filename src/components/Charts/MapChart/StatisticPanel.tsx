interface StatisticItem {
  label: string
  value: string | number
  icon?: string
}

interface StatisticPanelProps {
  statisticsData: StatisticItem[]
}

const StatisticPanel: React.FC<StatisticPanelProps> = ({ statisticsData }) => {
  return (
    <div className="absolute left-1/2  -translate-x-1/2  bottom-20 text-18px text-white">
      <div className="flex gap-20px">
        {statisticsData.map((item) => (
          <div className="flex-center gap-10px" key={item.label}>
            <img src={item.icon} alt="" className="w-[20px] h-[20px]" />
            <span>{item.label}</span>
            <span>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StatisticPanel
