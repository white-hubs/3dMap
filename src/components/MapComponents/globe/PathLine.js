import { Group, Vector3, CatmullRomCurve3, MeshBasicMaterial, AdditiveBlending, Mesh, TubeGeometry } from "three"
import { latLongToVector3 } from "@/mini3d"
export class PathLine {
  constructor({ time }, options) {
    this.time = time
    this.instance = new Group()
    this.run = true
    let defaultOptions = {
      speed: 0.003,
      texture: null,
      radius: 0.1,
      segments: 32,
      radialSegments: 8,
      data: [],
      renderOrder: 1,
      globeRadius: 100.5,
      customRunCallback: null,
      material: new MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        fog: false,
        depthTest: false,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    }
    this.options = Object.assign({}, defaultOptions, options)
    this.init()
  }
  init() {
    const { material, texture, segments, radius, radialSegments, data, speed, renderOrder, globeRadius } = this.options
    data.map((path) => {
      let pathPoint = []
      path.geometry.coordinates.map((coord) => {
        coord[0].forEach((item) => {
          let { x, y, z } = latLongToVector3(...item, globeRadius)
          pathPoint.push(new Vector3(x, y, z))
        })
      })
      const curve = new CatmullRomCurve3(pathPoint)
      const tubeGeometry = new TubeGeometry(curve, segments, radius, radialSegments, false)
      const mesh = new Mesh(tubeGeometry, material)
      mesh.position.set(0, 0, 0)
      mesh.renderOrder = renderOrder
      this.instance.add(mesh)
    })
    texture.offset.x = 0.5
    this.time.on("tick", (delta, elapsedTime) => {
      if (this.run) {
        if (this.options.customRunCallback) {
          this.options.customRunCallback.call(this, delta, elapsedTime, texture)
        } else {
          texture.offset.x += speed * delta
        }
      }
    })
  }
  getInstance() {
    return this.instance
  }
  setParent(parent) {
    parent.add(this.instance)
  }
  set visible(bool) {
    this.instance.visible = bool
    this.run = bool
  }
}
