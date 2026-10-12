import {
  CanvasTexture,
  SpriteMaterial,
  Vector3,
  Sprite,
  Mesh,
  PlaneGeometry,
  MeshBasicMaterial,
  DoubleSide,
  TextureLoader,
} from "three"
import { deepMerge } from "../utils/utils"
export class LabelCanvasSprite {
  constructor() {}
  createSpriteLabel(options) {
    let defaultOptions = {
      background: "rgba(0,0,0,0)",
      width: 200,
      height: 100,
      font: "bold 48px 宋体",
      color: "#ffffff",
      name: "",
      opacity: 1,
      position: new Vector3(0, 0, 0),
      scale: 1,
      isSprite: true,
    }
    defaultOptions = deepMerge(defaultOptions, options)
    let mesh = this.draw(defaultOptions)
    mesh.scale.set(defaultOptions.scale, defaultOptions.scale, 1)
    return mesh
  }
  draw(options) {
    let w = options.width
    let h = options.height
    let canvas = document.createElement("canvas")
    let ctx = canvas.getContext("2d")
    canvas.width = w
    canvas.height = h
    //左右翻转
    ctx.scale(-1, 1)
    ctx.translate(-w, 0)
    //制作矩形
    ctx.fillStyle = options.background || "#ff0000"
    ctx.fillRect(0, 0, w, h)
    //设置文字
    ctx.fillStyle = options.color || "#ffffff"
    ctx.font = options.font || h / 2 + 'px "微软雅黑"'
    ctx.textAlign = "center"
    ctx.fillStyle = "#ffffff"
    ctx.shadowColor = "rgba(0, 0, 0, 1)"
    ctx.shadowOffsetX = 0 //用来设定阴影在 X轴的延伸距
    ctx.shadowOffsetY = 5 //用来设定阴影在 Y轴的延伸距
    ctx.shadowBlur = 2 //设定阴影的模糊程度 默认0
    ctx.fillText(options.name, h, h / 2 + 20)
    //生成图片
    let url = canvas.toDataURL("image/png")
    //几何体--长方形
    let geometry = new PlaneGeometry(12, 6)
    //将图片构建到纹理中
    let material = new MeshBasicMaterial({
      map: new TextureLoader().load(url),
      side: DoubleSide, //两面可见
      opacity: options.opacity,
      transparent: true,
      depthWrite: false,
    })
    let mesh = new Mesh(geometry, material)
    mesh.position.copy(options.position)
    mesh.lookAt(new Vector3(0, 0, 0))
    return mesh
  }
}
