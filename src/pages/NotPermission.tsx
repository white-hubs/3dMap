const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen bg-[#05080a] text-white">
      <h1 className="text-9xl font-bold text-[#6AC161] opacity-20 animate-pulse">401</h1>
      <div className="mt-[-40px] text-center">
        <p className="text-2xl tracking-widest mb-8">您没有访问权限</p>
        <button className="px-8 py-2 border border-[#6AC161] text-[#6AC161] hover:bg-[#6AC161] hover:text-black transition-all duration-300">
          重新登录
        </button>
      </div>
    </div>
  )
}

export default NotFound
