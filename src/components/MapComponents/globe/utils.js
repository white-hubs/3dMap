import { LineBasicMaterial, BufferGeometry, BufferAttribute, LineSegments } from "three"
import { deepMerge } from "@/mini3d"
export const geoSphereCoord = (R, longitude, latitude) => {
  var lon = (longitude * Math.PI) / 180 //转弧度值
  var lat = (latitude * Math.PI) / 180 //转弧度值
  lon = -lon
  var x = R * Math.cos(lat) * Math.cos(lon)
  var y = R * Math.sin(lat)
  var z = R * Math.cos(lat) * Math.sin(lon)
  return {
    x: x,
    y: y,
    z: z,
  }
}
export const createCountryMergeSphereLine = (R, data, materialOptions = {}) => {
  let materialOpt = {
    color: 0x00ffff,
  }
  materialOpt = deepMerge(materialOpt, materialOptions)
  const material = new LineBasicMaterial(materialOpt)
  let features = data.features
  let allPointsData = getAllPoints(features)
  const position = new BufferAttribute(new Float32Array(allPointsData), 3)
  const geometry = new BufferGeometry()
  geometry.attributes.position = position
  let lineSegments = new LineSegments(geometry, material)
  lineSegments.scale.set(R, R, R)
  lineSegments.name = "createCountryMergeSphereLine"
  return lineSegments
}
export function getAllPoints(features) {
  let allPoints = []
  for (let i = 0; i < features.length; i++) {
    const element = features[i]
    element.geometry.coordinates.forEach((coords) => {
      const points = []
      coords[0].forEach((item) => {
        let { x, y, z } = geoSphereCoord(1, ...item)
        points.push(parseFloat(x.toFixed(3)), parseFloat(y.toFixed(3)), parseFloat(z.toFixed(3)))
      })
      allPoints.push(points[0], points[1], points[2])
      for (let k = 3; k < points.length; k += 3) {
        allPoints.push(points[k], points[k + 1], points[k + 2], points[k], points[k + 1], points[k + 2])
      }
      allPoints.push(points[0], points[1], points[2])
    })
  }
  return allPoints
}
export const createCountrySphereLine = (R, data, materialOptions = {}, lineType = "LineLoop") => {
  let materialOpt = {
    color: 0x00ffff,
  }
  materialOpt = deepMerge(materialOpt, materialOptions)
  const material = new THREE.LineBasicMaterial(materialOpt)
  let features = data.features
  let lineGroup = new THREE.Group()
  for (let i = 0; i < features.length; i++) {
    const element = features[i]
    element.geometry.coordinates.forEach((coords) => {
      const points = []
      coords[0].forEach((item) => {
        let { x, y, z } = geoSphereCoord(R, ...item)
        points.push(new THREE.Vector3(x, y, z))
      })
      let line = createLine(points, material, lineType)
      lineGroup.add(line)
    })
  }
  return lineGroup
}
export function checkDistance(start, end) {
  return Math.sqrt(
    (end.x - start.x) * (end.x - start.x) +
      (end.y - start.y) * (end.y - start.y) +
      (end.z - start.z) * (end.z - start.z)
  )
}
