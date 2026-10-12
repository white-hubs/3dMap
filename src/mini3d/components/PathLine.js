import { Group, Vector3, CatmullRomCurve3, MeshBasicMaterial, AdditiveBlending, Mesh, TubeGeometry } from "three"
export class PathLine {
  constructor({ time, geoProjection }, options) {
    this.time = time
    this.geoProjection = geoProjection
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
      material: new MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        fog: false,
        depthTest: false,
        blending: AdditiveBlending,
      }),
    }
    this.options = Object.assign({}, defaultOptions, options)
    this.init()
  }
  init() {
    const { material, texture, segments, radius, radialSegments, data, speed, renderOrder } = this.options
    data.map((path) => {
      let pathPoint = []
      path.geometry.coordinates.map((coord) => {
        coord[0].forEach((item) => {
          let [x, y] = this.geoProjection(item)
          pathPoint.push(new Vector3(x, -y, 0))
        })
      })
      const curve = new CatmullRomCurve3(pathPoint)
      const tubeGeometry = new TubeGeometry(curve, segments, radius, radialSegments, false)
      const mesh = new Mesh(tubeGeometry, material)
      mesh.position.set(0, 0, 0)
      mesh.renderOrder = renderOrder
      this.instance.add(mesh)
    })
    this.time.on("tick", (delta) => {
      if (this.run) {
        texture.offset.x += speed * delta
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
