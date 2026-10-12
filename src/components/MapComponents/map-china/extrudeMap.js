import {
  Mesh,
  Vector2,
  Vector3,
  Group,
  Shape,
  ExtrudeGeometry,
  MeshBasicMaterial,
  LineBasicMaterial,
  LineLoop,
  BufferGeometry,
} from "three"
import { transfromMapGeoJSON } from "@/mini3d"
export class ExtrudeMap {
  constructor({ assets, time, geoProjection }, config = {}) {
    this.geoProjection = geoProjection
    this.mapGroup = new Group()
    this.assets = assets
    this.time = time
    this.coordinates = []
    this.config = Object.assign(
      {
        position: new Vector3(0, 0, 0),
        center: new Vector2(0, 0),
        data: "",
        renderOrder: 1,
        lineRenderOrder: 2,
        topFaceMaterial: new MeshBasicMaterial({
          color: 0x18263b,
          transparent: true,
          opacity: 1,
        }),
        sideMaterial: new MeshBasicMaterial({
          color: 0x07152b,
          transparent: true,
          opacity: 1,
        }),
        lineMaterial: new LineBasicMaterial({ color: 0x2bc4dc }),
        depth: 0.1,
      },
      config
    )
    this.mapGroup.position.copy(this.config.position)
    let mapData = transfromMapGeoJSON(this.config.data)
    this.create(mapData)
  }
  create(mapData) {
    let { depth, renderOrder } = this.config
    let linesGroup = new Group()
    mapData.features.forEach((feature, groupIndex) => {
      let { name, center = [], centroid = [], adcode } = feature.properties
      this.coordinates.push({
        name,
        center,
        centroid,
        adcode,
        enName: "",
        value: 0,
      })
      const group = new Group()
      group.name = "meshGroup" + groupIndex
      group.userData.index = groupIndex
      group.userData.depth = this.config.depth
      group.userData.name = name
      group.userData.adcode = adcode
      let lineGroup = new Group()
      lineGroup.name = "lineGroup" + groupIndex
      lineGroup.userData.index = groupIndex
      lineGroup.userData.adcode = adcode
      const extrudeSettings = {
        depth: this.config.depth,
        bevelEnabled: true,
        bevelSegments: 1,
        bevelThickness: 0.1,
      }
      let materials = [this.config.topFaceMaterial.clone(), this.config.sideMaterial]
      feature.geometry.coordinates.forEach((multiPolygon) => {
        multiPolygon.forEach((polygon, index) => {
          const shape = new Shape()
          for (let i = 0; i < polygon.length; i++) {
            if (!polygon[i][0] || !polygon[i][1]) {
              return false
            }
            if (polygon[i].length > 2) {
              return false
            }
            const [x, y] = this.geoProjection(polygon[i])
            if (i === 0) {
              shape.moveTo(x, -y)
            }
            shape.lineTo(x, -y)
          }
          const geometry = new ExtrudeGeometry(shape, extrudeSettings)
          const mesh = new Mesh(geometry, materials)
          mesh.userData.depth = depth
          mesh.userData.name = name
          mesh.userData.adcode = adcode
          mesh.renderOrder = renderOrder
          group.add(mesh)
        })
        const points = []
        let line = null
        multiPolygon[0].forEach((item) => {
          const [x, y] = this.geoProjection(item)
          points.push(new Vector3(x, -y, 0))
          line = this.createLine(points)
        })
        lineGroup.add(line)
      })
      linesGroup.add(lineGroup)
      lineGroup.position.set(0, 0, this.config.depth + 0.11)
      group.add(lineGroup)
      this.mapGroup.add(group)
    })
  }
  createLine(points) {
    const geometry = new BufferGeometry()
    geometry.setFromPoints(points)
    let line = new LineLoop(geometry, this.config.lineMaterial)
    line.renderOrder = this.config.lineRenderOrder
    line.name = "mapLine"
    return line
  }
  getCoordinates() {
    return this.coordinates
  }
  setParent(parent) {
    parent.add(this.mapGroup)
  }
}
