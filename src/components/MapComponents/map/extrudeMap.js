import {
  Mesh,
  Vector2,
  Vector3,
  Color,
  Group,
  Object3D,
  BufferAttribute,
  RepeatWrapping,
  Shape,
  ExtrudeGeometry,
  MeshBasicMaterial,
  DoubleSide,
  MeshLambertMaterial,
  AdditiveBlending,
  MultiplyBlending,
  MeshStandardMaterial,
  LineBasicMaterial,
  BufferGeometry,
  LineLoop,
} from "three";
import { transfromMapGeoJSON, getBoundBox } from "@/mini3d";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils";
import { geoMercator } from "d3-geo";
// import config from "@/config"
export class ExtrudeMap {
  constructor({ assets, time }, config = {}) {
    this.mapGroup = new Group();
    this.assets = assets;
    this.time = time;
    this.coordinates = [];
    this.config = Object.assign(
      {
        position: new Vector3(0, 0, 0),
        center: new Vector2(0, 0),
        data: "",
        renderOrder: 1,
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
        line: true,
        lineMaterial: new LineBasicMaterial({ color: 0xffffff }),
        depth: 0.1,
      },
      config
    );
    this.mapGroup.position.copy(this.config.position);

    let mapData = transfromMapGeoJSON(this.config.data);
    this.create(mapData);
  }

  create(mapData) {
    let linesGroup = new Group();
    mapData.features.forEach((feature, groupIndex) => {
      // 获取属性中的名称，中心点，质心
      let { name, center = [], centroid = [], adcode } = feature.properties;
      this.coordinates.push({ name, center, centroid });

      const group = new Object3D();
      group.name = "meshGroup" + groupIndex;
      group.userData = {
        index: groupIndex,
        name,
        center,
        centroid: feature.properties.centroid || feature.properties.center,
        adcode,
        childrenNum: feature.properties.childrenNum,
      };
      // 线组
      let lineGroup = new Group();
      lineGroup.name = "lineGroup" + groupIndex;
      lineGroup.userData.index = groupIndex;
      lineGroup.userData.adcode = adcode;
      // 拉伸设置
      const extrudeSettings = {
        depth: this.config.depth,
        bevelEnabled: true,
        bevelSegments: 1,
        bevelThickness: 0.1,
      };
      let materials = [
        this.config.topFaceMaterial.clone(),
        this.config.sideMaterial,
      ];
      feature.geometry.coordinates.forEach((multiPolygon) => {
        multiPolygon.forEach((polygon, index) => {
          // 绘制shape
          const shape = new Shape();
          for (let i = 0; i < polygon.length; i++) {
            if (!polygon[i][0] || !polygon[i][1]) {
              return false;
            }
            const [x, y] = this.geoProjection(polygon[i]);
            if (i === 0) {
              shape.moveTo(x, -y);
            }
            shape.lineTo(x, -y);
          }

          const geometry = new ExtrudeGeometry(shape, extrudeSettings);
          const mesh = new Mesh(geometry, materials);
          mesh.userData = {
            name,
            center,
            centroid,
            adcode,
            material: materials,
          };
          mesh.renderOrder = this.config.renderOrder;

          group.add(mesh);
        });
        const points = [];
        let line = null;
        multiPolygon[0].forEach((item) => {
          const [x, y] = this.geoProjection(item);
          points.push(new Vector3(x, -y, 0));
          line = this.createLine(points);
        });
        lineGroup.add(line);
      });
      linesGroup.add(lineGroup);
      lineGroup.position.set(0, 0, this.config.depth + 0.1);
      if (this.config.line) {
        group.add(lineGroup);
      }
      this.mapGroup.add(group);
    });
  }
  createLine(points) {
    const geometry = new BufferGeometry();
    geometry.setFromPoints(points);
    let line = new LineLoop(geometry, this.config.lineMaterial);
    line.renderOrder = this.config.renderOrder + 1;
    line.name = "mapLine";
    return line;
  }
  // 转换坐标
  geoProjection(args) {
    return geoMercator()
      .center(this.config.center)
      .scale(1200)
      .translate([0, 0])(args);
  }
  getCoordinates() {
    return this.coordinates;
  }
  setParent(parent) {
    parent.add(this.mapGroup);
  }
}
