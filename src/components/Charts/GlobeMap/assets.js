import { Resource } from "@/mini3d"
import { FileLoader } from "three"
import earthAtmos from "@/assets/earth/earth09-2.jpg"
import earthNight from "@/assets/earth/earth-night2.jpg"
import earthClouds from "@/assets/earth/earth_clouds_1024.png"
import earthNormal from "@/assets/earth/earth_normal_2048.jpg"
import earthBump from "@/assets/earth/earth-topology.png"
import earthSpecular from "@/assets/earth/earth_specular_2048.jpg"
import highLight from "@/assets/earth/高光.jpg"
import globeHuiguang from "@/assets/earth/light.png"
import pointLight from "@/assets/earth/pointLight.png"
import lightPillar from "@/assets/texture/光柱.png"
import flyLine from "@/assets/texture/flyLine2.png"
import grid from "@/assets/texture/grid2.png"
import gridBlack from "@/assets/texture/grid2Black.png"
import pathLine from "@/assets/texture/pathLine2.png"
import flowY from "@/assets/earth/gradient.png"
import uv from "@/assets/texture/uv.png"
import chinaGlow from "@/assets/earth/china-glow3.png"
import cloud from "@/assets/earth/cloud.png"

// 地图
import topNormal from "@/assets/earth/chinaMapTexture2.jpg"
import chinaMapBg from "@/assets/earth/chinaMapBg2.jpg"
import chinaGlowNew from "@/assets/earth/china-glow-new.png"
import topFace from "@/assets/texture/topFace.png"
import point01 from "@/assets/texture/point01.png"
import point02 from "@/assets/texture/point02.png"
import side4 from "@/assets/texture/side4.png"
import guangquan1 from "@/assets/texture/guangquan01.png"
import guangquan2 from "@/assets/texture/guangquan02.png"
import huiguang from "@/assets/texture/huiguang.png"
import side from "@/assets/texture/side3.png"
import point from "@/assets/texture/point1.png"
import flyLineFocus from "@/assets/texture/guangquan01.png"
import blackBg from "@/assets/texture/black_bg4.jpg"
import szbg from "@/assets/texture/sz_bg.png"
import oceanBg from "@/assets/texture/oceanBg.jpg"
import grid3 from "@/assets/texture/grid3.png"
import rotationBorder1 from "@/assets/texture/rotationBorder1.png"
import rotationBorder2 from "@/assets/texture/rotationBorder2.png"
import nanhaiqundao from "@/assets/texture/nanhaiqundao.png"
import transparentTexture from "@/assets/texture/transparentTexture.png"
export class Assets {
  constructor(onLoadCallback = null) {
    this.onLoadCallback = onLoadCallback
    this.init()
  }
  init() {
    this.instance = new Resource()
    // 添加Fileloader
    this.instance.addLoader(FileLoader, "FileLoader")
    // 资源加载进度
    this.instance.on("onProgress", (path, itemsLoaded, itemsTotal) => {
      let progress = (itemsLoaded / itemsTotal) * 100
      let bfb = progress.toFixed(2) + "%!"
      // console.log(bfb, path, itemsLoaded, itemsTotal)
    })
    // 资源加载完成事件
    this.instance.on("onLoad", () => {
      // console.log("资源加载完成")
      this.onLoadCallback && this.onLoadCallback()
    })
    // 资源加载
    let base_url = import.meta.env.BASE_URL
    let assets = [
      { type: "Texture", name: "earthAtmos", path: earthAtmos },
      { type: "Texture", name: "earthNight", path: earthNight },
      { type: "Texture", name: "earthClouds", path: earthClouds },
      { type: "Texture", name: "earthNormal", path: earthNormal },
      { type: "Texture", name: "earthBump", path: earthBump },
      { type: "Texture", name: "earthSpecular", path: earthSpecular },
      { type: "Texture", name: "highLight", path: highLight },
      { type: "Texture", name: "globeHuiguang", path: globeHuiguang },
      { type: "Texture", name: "pointLight", path: pointLight },
      { type: "Texture", name: "lightPillar", path: lightPillar },
      { type: "Texture", name: "flyLine", path: flyLine },
      { type: "Texture", name: "gridBlack", path: gridBlack },
      { type: "Texture", name: "grid", path: grid },
      { type: "Texture", name: "pathLine", path: pathLine },
      { type: "Texture", name: "flowY", path: flowY },
      { type: "Texture", name: "uv", path: uv },
      { type: "Texture", name: "chinaGlow", path: chinaGlow },
      { type: "Texture", name: "cloud", path: cloud },

      {
        type: "File",
        name: "world",
        path: base_url + "assets/json/world.json",
      },
      {
        type: "File",
        name: "chinaStorke",
        path: base_url + "assets/json/中华人民共和国-轮廓-地球.json",
      },

      {
        type: "File",
        name: "china",
        path: base_url + "assets/json/中华人民共和国.json",
      },
      {
        type: "File",
        name: "guangdong",
        path: base_url + "assets/json/广东省.json",
      },
      {
        type: "File",
        name: "shenzhen",
        path: base_url + "assets/json/深圳市.json",
      },

      // 地图
      { type: "Texture", name: "huiguang", path: huiguang },
      { type: "Texture", name: "guangquan1", path: guangquan1 },
      { type: "Texture", name: "guangquan2", path: guangquan2 },
      { type: "Texture", name: "side", path: side },
      { type: "Texture", name: "flyLineFocus", path: flyLineFocus },
      { type: "Texture", name: "point", path: point },
      { type: "Texture", name: "blackBg", path: blackBg },
      { type: "Texture", name: "szbg", path: szbg },
      { type: "Texture", name: "oceanBg", path: oceanBg },
      { type: "Texture", name: "grid3", path: grid3 },
      { type: "Texture", name: "rotationBorder1", path: rotationBorder1 },
      { type: "Texture", name: "rotationBorder2", path: rotationBorder2 },
      { type: "Texture", name: "topNormal", path: topNormal },
      { type: "Texture", name: "chinaMapBg", path: chinaMapBg },
      { type: "Texture", name: "chinaGlowNew", path: chinaGlowNew },
      { type: "Texture", name: "topFace", path: topFace },
      { type: "Texture", name: "point01", path: point01 },
      { type: "Texture", name: "point02", path: point02 },
      { type: "Texture", name: "side4", path: side4 },
      { type: "Texture", name: "nanhaiqundao", path: nanhaiqundao },
      { type: "Texture", name: "transparentTexture", path: transparentTexture },
      {
        type: "File",
        name: "SZStorke",
        path: base_url + "assets/json/深圳市-轮廓.json",
      },
    ]
    // 资源加载
    this.instance.loadAll(assets)
  }
}
