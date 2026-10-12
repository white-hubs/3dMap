import { geoMercator } from 'd3-geo'
import gsap from 'gsap'
import {
  AdditiveBlending,
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  DirectionalLightHelper,
  DoubleSide,
  Float32BufferAttribute,
  Fog,
  Group,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshPhongMaterial,
  MeshStandardMaterial,
  NearestFilter,
  PlaneGeometry,
  PointLight,
  PointLightHelper,
  Points,
  PointsMaterial,
  QuadraticBezierCurve3,
  RepeatWrapping,
  SRGBColorSpace,
  Sprite,
  SpriteMaterial,
  Texture,
  TubeGeometry,
  Vector2,
  Vector3,
  VideoTexture,
} from 'three'
import { InteractionManager } from 'three.interactive'

import { BGCOLOR_MAP } from '@/common/const/index.ts'
import {
  Debug,
  GradientShader,
  Grid,
  Label3d,
  Mini3d,
  Particles,
  Plane,
  getBoundBox,
  maxBy,
  minBy,
  transfromMapGeoJSON,
} from '@/mini3d'

import { BaseMap } from './map/baseMap'
import chinaData from './map/chinaData'
import { ExtrudeMap } from './map/extrudeMap'
import { Line } from './map/line'
import provincesData from './map/provincesData'

// 排序
function sortByValue(data) {
  data.sort((a, b) => b.value - a.value)
  return data
}
export class SZMap {
  constructor(self) {
    this.self = self

    this.assets = self.assets
    this.time = self.time
    this.camera = self.camera
    this.scene = self.scene
    this.sizes = self.sizes

    this.run = false
    // 中心坐标
    this.pointCenter = [114.143142, 22.643377]
    this.flyLineCenter = [114.046594, 22.543431]
    this.depth = 0.3
    this.clicked = false
    this.over = false
    this.sceneGroup = new Group()
    this.sceneGroup.visible = false
    this.sceneGroup.rotation.x = -Math.PI / 2
    this.labelGroup = new Group()
    this.label3d = new Label3d(this.self)
    this.labelGroup.rotation.x = -Math.PI / 2
    // 整体向下微调：避免与海面/其它层级出现“漂浮”感
    this.sceneGroup.position.y = -1
    this.labelGroup.position.y = -1
    // 事件元素
    this.eventElement = []
    // 鼠标移上移除的材质
    this.defaultMaterial = null // 默认材质
    this.defaultLightMaterial = null // 高亮材质
    this.scene.add(this.labelGroup, this.sceneGroup)

    this.init()
    // 更新
    this.update()
    // this.getShopName()
  }

  init() {
    // 创建海洋
    this.createFloor()
    // 创建标签
    this.createLabel()
    // 创建模型
    this.createModel()
    // 创建顶部发光
    this.createTopGlow()
    // 创建旋转边框
    this.createRotateBorder()
    // 创建描边动画
    this.createStorke()
  }

  show() {
    this.run = true
    this.sceneGroup.visible = true
    this.bgMapGroup.scale.set(0, 0, 0)
    this.sceneGroup.scale.set(0, 0, 0)
  }
  showLabel() {
    this.labelGroup.traverse((label) => {
      label.show && label.show()
    })
  }
  hide() {
    this.run = false
    this.sceneGroup.visible = false
    this.labelGroup.traverse((label) => {
      label.hide && label.hide()
    })
    this.bgMapGroup.scale.set(0, 0, 0)
    this.sceneGroup.scale.set(0, 0, 0)
    this.removeEvent()
  }
  initAnimate() {
    // this.initEnvironment()

    this.scene.fog = false
    // this.scene.background = new Color(0x000000)
    this.scene.background = null
    // this.camera.setCamera(false)
    this.camera.controls.enabled = false
    this.camera.instance.position.set(-13.767695123014105, 12.990152163077308, 39.28228164159694)
    this.bgMapGroup.scale.set(1, 1, 1)
    this.sceneGroup.scale.set(1, 1, 1)
    let tl = gsap.timeline()
    // 相机动画
    tl.addLabel('focusMap', 2)
    tl.addLabel('focusMapOpacity', 2.5)
    tl.addLabel('bar', 3.5)
    tl.add(
      gsap.to(this.camera.instance.position, {
        duration: 2.5,
        x: -0.2515849818960619,
        y: 12.397744557047988,
        z: 14.647659671139275,
        ease: 'circ.out',
      }),
    )
    // 焦点地图出现
    tl.add(
      gsap.to(this.focusMapGroup.position, {
        duration: 1,
        x: 0,
        y: 0,
        z: 0,
      }),
      'focusMap',
    )
    tl.add(
      gsap.to(this.focusMapGroup.scale, {
        duration: 1,
        x: 1,
        y: 1,
        z: 1,
        ease: 'circ.out',
      }),
      'focusMap',
    )

    tl.add(
      gsap.to(this.focusMapTopMaterial, {
        duration: 1,
        opacity: 1,
        ease: 'circ.out',
      }),
      'focusMapOpacity',
    )
    tl.add(
      gsap.to(this.focusMapSideMaterial, {
        duration: 1,
        opacity: 1,
        ease: 'circ.out',
        onComplete: () => {
          this.focusMapSideMaterial.transparent = false
          this.camera.controls.enabled = true
          this.initEvent()
        },
      }),
      'focusMapOpacity',
    )
    this.otherLabel.map((item, index) => {
      let element = item.element.querySelector('.other-label')
      tl.add(
        gsap.to(element, {
          duration: 1,
          delay: 0.1 * index,
          translateY: 0,
          opacity: 0.5,
          ease: 'circ.out',
        }),
        'focusMapOpacity',
      )
    })
    tl.add(
      gsap.to(this.focusMapLineMaterial, {
        duration: 0.5,
        delay: 0.3,
        opacity: 0.1,
      }),
      'focusMapOpacity',
    )
    tl.add(
      gsap.to(this.borderGlowMaterial, {
        duration: 0.5,
        delay: 0.6,
        opacity: 1,
      }),
      'focusMapOpacity',
    )
    tl.add(
      gsap.to(this.rotateBorder1.scale, {
        delay: 0.3,
        duration: 1,
        x: 1,
        y: 1,
        z: 1,
        ease: 'circ.out',
      }),
      'focusMapOpacity',
    )
    tl.add(
      gsap.to(this.rotateBorder2.scale, {
        duration: 1,
        delay: 0.5,
        x: 1,
        y: 1,
        z: 1,
        ease: 'circ.out',
      }),
      'focusMapOpacity',
    )
    this.allBar.map((item, index) => {
      tl.add(
        gsap.to(item.scale, {
          duration: 1,
          delay: 0.1 * index,
          x: 1,
          y: 1,
          z: 1,
          ease: 'circ.out',
        }),
        'bar',
      )
    })
    this.allBarMaterial.map((item, index) => {
      tl.add(
        gsap.to(item, {
          duration: 1,
          delay: 0.1 * index,
          opacity: 1,
          ease: 'circ.out',
        }),
        'bar',
      )
    })

    // allProvinceLabel 在改造后可能包含两种对象：
    // 1) 旧版 Label3d：有 item.element（DOM），可做 translate/number 动画
    // 2) 新版 Sprite(CanvasTexture)：没有 item.element，不走 DOM 动画，避免报错中断后续 allGuangquan 动画
    this.allProvinceLabel.map((item, index) => {
      if (!item || !item.element) return

      let element = item.element.querySelector('.sz-label-wrap')
      let number = item.element.querySelector('.number .value')
      if (!element || !number) return

      let numberVal = Number(number.innerText)
      let numberAnimate = {
        score: 0,
      }
      tl.add(
        gsap.to(element, {
          duration: 1,
          delay: 0.2 * index,
          translateY: 0,
          opacity: 1,
          ease: 'circ.out',
        }),
        'bar',
      )
      let text = gsap.to(numberAnimate, {
        duration: 1,
        delay: 0.2 * index,
        score: numberVal,
        onUpdate: showScore,
      })
      function showScore() {
        number.innerText = numberAnimate.score.toFixed(0)
      }
      tl.add(text, 'bar')
    })
    this.allGuangquan.map((item, index) => {
      tl.add(
        gsap.to(item.children[0].scale, {
          duration: 1,
          delay: 0.1 * index,
          x: 1,
          y: 1,
          z: 1,
          ease: 'circ.out',
        }),
        'bar',
      )
      tl.add(
        gsap.to(item.children[1].scale, {
          duration: 1,
          delay: 0.1 * index,
          x: 1,
          y: 1,
          z: 1,
          ease: 'circ.out',
        }),
        'bar',
      )
    })
  }
  // 初始化环境灯光
  initEnvironment() {
    // 方向光
    let directionalLight = new DirectionalLight(0xffffff, 8)
    directionalLight.position.set(-30, 6, -8)
    directionalLight.castShadow = true
    directionalLight.shadow.radius = 20
    directionalLight.shadow.mapSize.width = 1024
    directionalLight.shadow.mapSize.height = 1024
    this.scene.add(directionalLight)

    this.createPointLight({
      color: 0x334058,
      intensity: 600,
      distance: 10000,
      x: -9,
      y: 3,
      z: -3,
    })
    this.createPointLight({
      color: 0x334058,
      intensity: 230,
      distance: 10000,
      x: 0,
      y: 2,
      z: 5,
    })
  }
  createPointLight(pointParams) {
    // 点光源
    const pointLight = new PointLight(0x334058, pointParams.intensity, pointParams.distance, 1)
    pointLight.position.set(pointParams.x, pointParams.y, pointParams.z)
    this.scene.add(pointLight)
  }

  // 模型渲染
  createModel() {
    this.bgMapGroup = new Group()
    this.bgMapGroup.scale.set(0, 0, 0)
    this.focusMapGroup = new Group()
    let { bgMap, bgMapTopFace } = this.createBgMap()
    let { focusMap } = this.createFocusMap()
    bgMapTopFace.setParent(this.bgMapGroup)
    bgMap.setParent(this.bgMapGroup)

    focusMap.setParent(this.focusMapGroup)

    this.focusMapGroup.position.set(0, 0, -0.01)
    this.focusMapGroup.scale.set(1, 1, 0)
    this.bgMapGroup.add(this.focusMapGroup)
    this.bgMapGroup.position.set(0, 0.2, 0)
    this.sceneGroup.add(this.bgMapGroup)
    this.createBar()
  }
  // 创建背景地图
  createBgMap() {
    // 中国地图
    let blackBg = this.assets.getResource('blackBg')
    let grid3 = this.assets.getResource('grid3')
    blackBg.wrapS = blackBg.wrapT = RepeatWrapping
    grid3.wrapS = grid3.wrapT = RepeatWrapping
    grid3.repeat.set(0.5, 0.5)
    let bgMapData = this.assets.getResource('guangdong')
    let topFaceMaterial = new MeshLambertMaterial({
      color: 0x212733,
      map: blackBg,
      normalMap: blackBg,
      transparent: true,
      opacity: 1,
    })
    let bgMap = new ExtrudeMap(this, {
      data: bgMapData,
      center: this.pointCenter,
      position: new Vector3(0, 0, 0.11),
      depth: 0.1,
      topFaceMaterial: topFaceMaterial,
      sideMaterial: new MeshLambertMaterial({
        color: 0x0a1120,
        transparent: true,
        opacity: 1,
      }),
      lineMaterial: new LineBasicMaterial({
        color: new Color(91, 107, 147),
        transparent: true,
        depthTest: false,
        opacity: 0.05,
      }),
      renderOrder: 2,
    })
    let bgMapTopFace = new BaseMap(this, {
      data: bgMapData,
      center: this.pointCenter,
      position: new Vector3(0, 0, 0.32),
      merge: false,
      material: new MeshLambertMaterial({
        // color: 0x122a32,
        map: grid3,
        transparent: true,
        opacity: 0.05,
        blending: AdditiveBlending,
      }),

      renderOrder: 2,
    })

    let { boxSize, box3, center } = getBoundBox(bgMap.mapGroup)
    bgMap.mapGroup.children.map((group, index) => {
      group.children.map((mesh) => {
        if (mesh.type === 'Mesh') {
          // 重新计算uv
          this.calcUv2(mesh.geometry, boxSize.x, boxSize.y, box3.min.x, box3.min.y)
        }
      })
    })

    return { bgMap, bgMapTopFace }
  }
  // 创建焦点地图
  createFocusMap() {
    // 深圳地图
    let focusMapData = this.assets.getResource('shenzhen')
    let [topMaterial, sideMaterial] = this.createFocusMapMaterial()
    this.focusMapTopMaterial = topMaterial
    this.focusMapSideMaterial = sideMaterial
    // 地图线
    this.focusMapLineMaterial = new LineBasicMaterial({
      color: 0xffffff,
      opacity: 0,
      transparent: true,
      depthTest: false,
      fog: false,
    })
    let focusMap = new ExtrudeMap(this, {
      center: this.pointCenter,
      position: new Vector3(0, 0, 0.42),
      data: focusMapData,
      depth: this.depth,
      topFaceMaterial: topMaterial,
      sideMaterial: sideMaterial,
      lineMaterial: this.focusMapLineMaterial,
      renderOrder: 4,
    })
    let { boxSize, box3, center } = getBoundBox(focusMap.mapGroup)
    focusMap.mapGroup.children.map((group, index) => {
      group.children.map((mesh) => {
        if (mesh.type === 'Mesh') {
          this.eventElement.push(mesh)
          // 重新计算uv
          this.calcUv2(mesh.geometry, boxSize.x, boxSize.y, box3.min.x, box3.min.y)
        }
      })
    })

    // 设置默认材质
    this.defaultMaterial = topMaterial
    this.defaultLightMaterial = new Color('rgb(41,159,255)')

    return {
      focusMap,
    }
  }
  createFocusMapMaterial() {
    let blackBg = this.assets.getResource('blackBg').clone()
    blackBg.colorSpace = SRGBColorSpace
    let topMaterial = new MeshBasicMaterial({
      color: 0xbabcfd,
      map: blackBg,
      transparent: true,
      opacity: 1,
      fog: false,
      side: DoubleSide,
    })

    let sideMap = this.assets.getResource('side')
    sideMap.wrapS = RepeatWrapping
    sideMap.wrapT = RepeatWrapping
    sideMap.repeat.set(1, 2)
    sideMap.offset.y += 0.065
    let sideMaterial = new MeshStandardMaterial({
      color: 0xffffff,
      map: sideMap,
      fog: false,
      opacity: 0,
      side: DoubleSide,
    })

    this.time.on('tick', () => {
      if (this.run) sideMap.offset.y += 0.005
    })
    sideMaterial.onBeforeCompile = (shader) => {
      shader.uniforms = {
        ...shader.uniforms,
        uColor1: { value: new Color(0x2a6f72) },
        uColor2: { value: new Color(0x2a6f72) },
      }
      shader.vertexShader = shader.vertexShader.replace(
        'void main() {',
        `
        attribute float alpha;
        varying vec3 vPosition;
        varying float vAlpha;
        void main() {
          vAlpha = alpha;
          vPosition = position;
      `,
      )
      shader.fragmentShader = shader.fragmentShader.replace(
        'void main() {',
        `
        varying vec3 vPosition;
        varying float vAlpha;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
      
        void main() {
      `,
      )
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <opaque_fragment>',
        /* glsl */ `
      #ifdef OPAQUE
      diffuseColor.a = 1.0;
      #endif
      
      // https://github.com/mrdoob/three.js/pull/22425
      #ifdef USE_TRANSMISSION
      diffuseColor.a *= transmissionAlpha + 0.1;
      #endif
      vec3 gradient = mix(uColor1, uColor2, vPosition.z/1.2);
      
      outgoingLight = outgoingLight*gradient;
      
      
      gl_FragColor = vec4( outgoingLight, diffuseColor.a  );
      `,
      )
    }
    return [topMaterial, sideMaterial]
  }
  createTopGlow() {
    let geometry = new PlaneGeometry(28, 28)
    const texture = this.assets.getResource('szbg')
    texture.colorSpace = SRGBColorSpace
    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping
    texture.repeat.set(1, 1)
    // texture.magFilter = NearestFilter
    let material = new MeshBasicMaterial({
      map: texture,
      color: 0x009af4,
      opacity: 0,
      transparent: true,
      blending: AdditiveBlending,
      side: DoubleSide,
      depthTest: false,
    })
    this.borderGlowMaterial = material
    let mesh = new Mesh(geometry, material)
    mesh.renderOrder = 20
    mesh.position.set(0.544, -0.058, 0.835)
    mesh.scale.set(0.812, 0.812, 0.812)
    this.sceneGroup.add(mesh)
  }
  removeEvent() {
    if (this.interactionManager) {
      ;[...this.eventElement, ...this.labelEventElement].map((mesh) => {
        this.interactionManager.remove(mesh)
      })
      this.interactionManager.dispose()
    }
  }
  initEvent() {
    this.removeEvent()
    this.interactionManager = new InteractionManager(
      this.self.renderer.instance,
      this.camera.instance,
      this.self.canvas,
    )
    this.meshEventAction = {
      reset: (mesh) => {
        // 还原颜色
        mesh.traverse((obj) => {
          if (obj.isMesh) {
            // obj.material[0].color = new Color(this.defaultMaterial);
            obj.material[0] = this.defaultMaterial.clone()
          }
        })
      },
      move: (mesh) => {
        // 设置发光颜色
        mesh.traverse((obj) => {
          if (obj.isMesh) {
            obj.material[0].color = new Color(this.defaultLightMaterial)
            obj.material[0].map = null
            // obj.material[0].emissive.setHex(0x0b112d);
            // obj.material[0].emissiveIntensity = 3.5;
          }
        })
      },
    }

    this.createEvent()
  }
  // 添加事件
  createEvent() {
    // hover的对象
    let objectsHover = []

    // 循环添加事件
    this.eventElement.map((mesh) => {
      this.interactionManager.add(mesh)
      mesh.addEventListener('mousedown', (ev) => {
        if (this.clicked) return false
        this.clicked = true
        this.self.emit('szMapClick', ev.target.userData)
      })
      mesh.addEventListener('mouseup', (ev) => {
        this.clicked = false
      })
      mesh.addEventListener('mouseover', (event) => {
        if (!this.run || this.over) return false
        this.over = true
        if (!objectsHover.includes(event.target.parent)) {
          objectsHover.push(event.target.parent)
        }
        document.body.style.cursor = 'pointer'
        this.meshEventAction.move(event.target.parent)
        this.self.emit('szMapMouseOver', event, event.target.userData)
      })
      mesh.addEventListener('mouseout', (event) => {
        this.over = false
        objectsHover = objectsHover.filter(
          (n) => n.userData.name !== event.target.parent.userData.name,
        )
        if (objectsHover.length > 0) {
          const mesh = objectsHover[objectsHover.length - 1]
        }
        this.meshEventAction.reset(event.target.parent)
        document.body.style.cursor = 'default'
        this.self.emit('szMapMouseOut', event, event.target.userData)
      })
    })

    this.createLabelClickEvent()
  }
  createLabelClickEvent() {
    this.labelEventElement.forEach((mesh) => {
      this.interactionManager.add(mesh)

      mesh.addEventListener('mousedown', (event) => {
        if (this.clicked) return false
        this.clicked = true
        this.self.emit('szMapLabelClick', event.target.userData)
      })
      mesh.addEventListener('mouseup', (event) => {
        this.clicked = false
      })
      mesh.addEventListener('mouseover', (event) => {
        if (!this.run || this.over) return false
        this.over = true
        document.body.style.cursor = 'pointer'
        this.self.emit('szMapLabelMouseover', event, event.target.userData)
      })
      mesh.addEventListener('mouseout', (event) => {
        this.over = false
        document.body.style.cursor = 'default'
        this.self.emit('szMapLabelMouseout', event, event.target.userData)
      })
    })
  }
  createLightMesh(userData) {
    // 深圳地图
    let focusMapData = this.assets.getResource('shenzhen')
    focusMapData = transfromMapGeoJSON(focusMapData)
    focusMapData.features = focusMapData.features.filter(
      (item) => item.properties.name === userData.name,
    )
    focusMapData = JSON.stringify(focusMapData)

    let { faceHightMaterial, sideHightMaterial } = this.createLightMaterial()

    let focusLightMap = new ExtrudeMap(this, {
      center: this.pointCenter,
      position: new Vector3(0, 0, 0.42),
      data: focusMapData,
      depth: 0.01,
      topFaceMaterial: faceHightMaterial,
      sideMaterial: sideHightMaterial,
      lineMaterial: new LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        depthTest: false,
      }),
      renderOrder: 10,
    })
    focusLightMap.mapGroup.position.z += 0.5
    // focusLightMap.mapGroup.position.z += 0.4;
    // focusLightMap.mapGroup.scale.set(1.0, 1.0, 0.01);
    let box = getBoundBox(focusLightMap.mapGroup)
    let size = Math.max(box.boxSize.x, box.boxSize.y)
    // console.log(focusLightMap.mapGroup);
    focusLightMap.mapGroup.traverse((obj) => {
      if (obj.isMesh) {
        new GradientShader(obj.material[0], {
          uColor1: 0x9ac2ff,
          uColor2: 0xe1e9f4,
          dir: 'z',
          size: 5.0, // 物体的宽度，或者高度
        })
      }
    })

    new GradientShader(sideHightMaterial, {
      uColor1: 0x13367c,
      uColor2: 0x639cf7,
      dir: 'y',
      size: box.boxSize.z,
    })
    return focusLightMap.mapGroup
  }

  createLightMaterial() {
    let faceHightMaterial = new MeshBasicMaterial({
      fog: false,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    })
    let sideHightMaterial = new MeshBasicMaterial({
      fog: false,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    })

    return { faceHightMaterial, sideHightMaterial }
  }
  // 创建柱状图
  createBar() {
    let self = this
    let data = sortByValue(provincesData) //.filter((item, index) => index < 7)

    const barGroup = new Group()
    // 最大高度
    const factor = 0.5
    const height = 4.0 * factor
    const max = data[0].value
    // 存储动画元素
    this.allBar = []
    this.allBarMaterial = []
    this.allGuangquan = []
    this.allProvinceLabel = []
    this.labelEventElement = []
    data.map((item, index) => {
      // 网格
      let geoHeight = height * (item.value / max)
      if (item.name === '福田农批' || item.name === '深圳海吉星' || item.name === '布吉海鲜') {
        geoHeight = geoHeight * 0.5 // 或者直接设为一个固定值，如 0.2
      }
      if (item.name === '深圳海吉星') {
        geoHeight = geoHeight * 0.7
      }
      if (item.name === '产业公司' || item.name === '布吉农批') {
        geoHeight = geoHeight * 0.5
      }
      if (item.name === '运通冷链') {
        geoHeight = geoHeight * 1.6
      }
      if (item.name === '南方物流') {
        geoHeight = geoHeight * 1.2
      }
      if (item.name === '布吉海鲜') {
        geoHeight = geoHeight * 2
      }
      // 材质
      let material = new MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthTest: false,
        fog: false,
      })
      // 设置渐变材质
      // FBDF88 FFFEF4
      new GradientShader(material, {
        uColor1: index > 3 ? 0xfbdf88 : 0x50bbfe,
        uColor2: index > 3 ? 0xfffef4 : 0x77fbf5,
        size: geoHeight,
        dir: 'y',
      })
      const geo = new BoxGeometry(0.1 * factor, 0.1 * factor, geoHeight)
      // 上移
      geo.translate(0, 0, geoHeight / 2)
      const mesh = new Mesh(geo, material)
      mesh.renderOrder = 20
      let areaBar = mesh
      let [x, y] = this.geoProjection(item.centroid)
      const offsets = {
        // '集贸市场': { ox: 0, oy: 0.2 }, // 福田农批
        // '福田农批': { ox: 0.2, oy: -0.2 }, // 福田农批
        // '布吉海鲜': { ox: -0.2, oy: 0.2 }, // 布吉海鲜
        产业公司: { ox: 1, oy: 0 }, // 产业公司
        // 布吉农批: { ox: 0.5, oy: 0 }, // 布吉农批
      }
      const offset = offsets[item.name] || { ox: 0, oy: 0 }
      let finalX = x + offset.ox
      let finalY = -y + offset.oy
      areaBar.position.set(finalX, finalY, this.depth + 0.75)
      areaBar.scale.set(1, 1, 0)
      let guangQuan = this.createQuan(new Vector3(finalX, finalY, this.depth + 0.75), index)
      let hg = this.createHUIGUANG(geoHeight, index > 3 ? 0xfffef4 : 0x77fbf5)
      areaBar.add(...hg)
      barGroup.add(areaBar)
      // 使用 Sprite(Canvas 纹理) 绘制标签
      let barLabel = labelStyle04(item, index, new Vector3(finalX, finalY, 1.6 + geoHeight))
      this.allBar.push(areaBar)
      this.allBarMaterial.push(material)
      this.allGuangquan.push(guangQuan)
      this.allProvinceLabel.push(barLabel)
    })
    this.sceneGroup.add(barGroup)

    // function labelStyle04(data, index, position) {
    //   let label = self.label3d.create("", "sz-label", false)
    //   const [x, y] = self.geoProjection(data.center)
    //   label.init(
    //     `<div class="sz-label sz-label-click ${data.isBase ? "yellow" : ""}" data-adcode="${data.adcode}">
    //     <div class="sz-label-wrap">
    //       <div class="name">
    //         ${data.name}
    //       </div>
    //       <div class="number"><span class="value">${data.value}</span>万元</div>
    //     </div>
    //   </div>`,
    //     position
    //   )
    //   self.label3d.setLabelStyle(label, 0.01, "x")
    //   label.setParent(self.labelGroup)

    //   return label
    // }
    // 使用 Sprite + CanvasTexture 绘制柱状图标签，尽量还原原有样式
    function labelStyle04(data, index, position) {
      const canvas = document.createElement('canvas')
      // 使用 DPR 提升贴图清晰度，避免文字在 3D 缩放后看起来发暗/发糊
      // 同时增大画布逻辑尺寸，提高文字的像素密度
      const LOGICAL_W = 640
      const LOGICAL_H = 160
      const rawDpr =
        typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1
      const dpr = Math.min(rawDpr, 3)
      canvas.width = Math.floor(LOGICAL_W * dpr)
      canvas.height = Math.floor(LOGICAL_H * dpr)
      const ctx = canvas.getContext('2d')
      if (!ctx) return null

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H)

      // 按 DOM CSS 模拟绘制：background / padding / box-shadow / border / border-radius / text-shadow
      const bgColor =
        (data?.type && BGCOLOR_MAP[data.type]) ||
        (data?.isBase ? 'rgba(1, 164, 79, 0.80)' : 'rgba(0, 88, 255, 0.80)')
      const borderColor = 'rgba(100, 200, 255, 0.5)'

      // 给背景留边距，避免 box-shadow 被贴图裁切
      const margin = 8
      const paddingX = 10
      const paddingY = 4
      const radius = 6 // 近似 border-radius: 2px（Canvas 缩放后更接近视觉）

      const x = margin
      const y = margin
      const w = LOGICAL_W - margin * 2
      const h = LOGICAL_H - margin * 2

      // box-shadow（核心立体投影）
      ctx.save()
      ctx.shadowColor = 'rgba(0,0,0,0.6)'
      ctx.shadowBlur = 10
      ctx.shadowOffsetX = 4
      ctx.shadowOffsetY = 4

      ctx.fillStyle = bgColor
      ctx.strokeStyle = borderColor
      ctx.lineWidth = 2 // 近似 border: 1.5px

      // 圆角矩形
      ctx.beginPath()
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + w - radius, y)
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
      ctx.lineTo(x + w, y + h - radius)
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
      ctx.lineTo(x + radius, y + h)
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.restore()

      // text-shadow + color: #ffffff
      ctx.save()
      // 水平居中
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#ffffff'
      // 去掉或极弱化文字阴影：依靠 stroke 提升可读性，避免“糊边”
      ctx.shadowColor = 'rgba(0, 0, 0, 0.0)'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0

      const nameText = data.name
      const textX = x + paddingX
      // 仅保留名称：把文字垂直居中
      const nameY = LOGICAL_H / 2
      const nameX = LOGICAL_W / 2
      // 字号调大 + 字重更粗（接近“加粗”效果）
      ctx.font = '900 74px Microsoft YaHei, sans-serif'
      ctx.lineJoin = 'round'
      // 让文字更“白”和更立体：先深色粗描边，再白色填充（解决边缘灰蒙蒙）
      // ctx.lineWidth = 10
      // ctx.strokeStyle = 'rgba(0,0,0,0.65)'
      // ctx.strokeText(nameText, nameX, nameY)
      // ctx.fillStyle = '#ffffff'
      // ctx.fillText(nameText, nameX, nameY)

      // 轻微高光（模拟 text-shadow 的立体感，但不使用 blur）
      //ctx.fillStyle = 'rgba(215, 245, 255, 0.95)'
      ctx.fillText(nameText, nameX - 4, nameY - 6)

      ctx.restore()

      const texture = new CanvasTexture(canvas)
      texture.colorSpace = SRGBColorSpace
      texture.needsUpdate = true
      // 标签贴图属于 UI 文字，尽量不要走模糊插值
      texture.minFilter = NearestFilter
      texture.magFilter = NearestFilter

      const material = new SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 1,
        // 让贴图里过于透明的边缘像素直接丢弃，提升文字对比度/清晰度
        alphaTest: 0.05,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      })
      const sprite = new Sprite(material)

      sprite.position.copy(position)
      // 根据实际效果可微调缩放值，尽量保持与原 HTML 标签相近
      const baseScaleX = 2.4 * 0.8
      const baseScaleY = 0.6 * 0.8
      sprite.scale.set(baseScaleX, baseScaleY, 1)

      // 与 SZMap.showLabel()/hide() 的 traverse 逻辑保持一致
      sprite.visible = false
      sprite.show = () => {
        sprite.visible = true
      }
      sprite.hide = () => {
        sprite.visible = false
      }

      sprite.userData.adcode = data.adcode
      sprite.userData.name = data.name
      sprite.userData.position = [position.x, position.y, position.z]
      sprite.userData.centroid = data.centroid
      sprite.userData.center = data.center
      sprite.userData.id = data.id

      // 让标签支持交互事件
      self.labelEventElement.push(sprite)

      // 保持与原 Label3d 标签一致：挂到 labelGroup 下
      sprite.renderOrder = 35
      self.labelGroup.add(sprite)
      return sprite
    }
  }
  // 创建空白标签
  labelEmptySprite(data, position) {
    let transparentTexture = this.assets.getResource('transparentTexture')
    //let geometry = new PlaneGeometry(2.5, 0.6)

    let geometry = new PlaneGeometry(1.2, 0.4)
    geometry.translate(0.3, 0.4, 0)
    // geometry.translate(0, 0, 0)
    let material = new MeshBasicMaterial({
      color: 0xffffff,
      opacity: 1,
      depthTest: true,
      depthWrite: true,
      side: DoubleSide,
      transparent: true,
    })
    let mesh = new Mesh(geometry, material)
    mesh.position.copy(position)
    mesh.rotation.x = -Math.PI / 2
    // mesh.scale.set(5.4, 2.5, 1)
    // mesh.center = new Vector2(0.5, 0)
    mesh.userData.adcode = data.adcode
    mesh.userData.name = data.name
    mesh.userData.position = [position.x, position.y, position.z]
    mesh.userData.centroid = data.centroid
    mesh.userData.center = data.center
    mesh.userData.id = data.id
    return mesh
  }
  createHUIGUANG(h, color) {
    let geometry = new PlaneGeometry(0.3, h)
    geometry.translate(0, h / 2, 0)
    const texture = this.assets.getResource('huiguang')
    texture.colorSpace = SRGBColorSpace
    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping
    let material = new MeshBasicMaterial({
      color: color,
      map: texture,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      // depthTest: false,
      side: DoubleSide,
      blending: AdditiveBlending,
    })
    let mesh = new Mesh(geometry, material)
    mesh.renderOrder = 22
    mesh.rotateX(Math.PI / 2)
    let mesh2 = mesh.clone()
    let mesh3 = mesh.clone()
    mesh2.rotateY((Math.PI / 180) * 60)
    mesh3.rotateY((Math.PI / 180) * 120)
    return [mesh, mesh2, mesh3]
  }
  createQuan(position, index) {
    const guangquan1 = this.assets.getResource('guangquan1')
    const guangquan2 = this.assets.getResource('guangquan2')
    let geometry = new PlaneGeometry(0.5, 0.5)

    let material1 = new MeshBasicMaterial({
      color: 0xffffff,
      map: guangquan1,
      alphaMap: guangquan1,
      opacity: 1,
      transparent: true,
      depthTest: false,
      fog: false,
      blending: AdditiveBlending,
    })
    let material2 = new MeshBasicMaterial({
      color: 0xffffff,
      map: guangquan2,
      alphaMap: guangquan2,
      opacity: 1,
      transparent: true,
      depthTest: false,
      fog: false,
      blending: AdditiveBlending,
    })
    let mesh1 = new Mesh(geometry, material1)
    let mesh2 = new Mesh(geometry, material2)
    mesh1.renderOrder = 21
    mesh2.renderOrder = 21

    mesh1.position.copy(position)
    mesh2.position.copy(position)
    mesh2.position.y -= 0.001
    mesh1.scale.set(0, 0, 0)
    mesh2.scale.set(0, 0, 0)
    this.quanGroup = new Group()
    this.quanGroup.add(mesh1, mesh2)
    this.sceneGroup.add(this.quanGroup)
    this.time.on('tick', () => {
      if (this.run) mesh1.rotation.z += 0.05
    })
    return this.quanGroup
  }

  /**
   * 创建海洋
   */
  createFloor() {
    let geometry = new PlaneGeometry(200, 108, 1, 1)
    const texture = this.assets.getResource('oceanBg')

    texture.colorSpace = SRGBColorSpace
    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping
    texture.repeat.set(1, 1)
    let material = new MeshStandardMaterial({
      map: texture,
      transparent: true,
      opacity: 1,
      color: new Color('#313f57'),
      emissive: new Color('#000000'),
    })
    let mesh = new Mesh(geometry, material)

    mesh.position.set(0, 0.2, 0)
    this.sceneGroup.add(mesh)
  }

  createLabel() {
    let self = this
    let labelGroup = this.labelGroup
    let label3d = this.label3d
    let otherLabel = []
    chinaData.map((data) => {
      if (data.hide == true) return false
      let label = labelStyle01(data, label3d, labelGroup)
      otherLabel.push(label)
    })

    this.otherLabel = otherLabel
    // 省份名字标签
    function labelStyle01(data, label3d, labelGroup) {
      let label = label3d.create('', `city-label ${data.blur ? ' blur' : ''}`, false)
      const [x, y] = self.geoProjection(data.centroid)
      label.init(`<div class="other-label">${data.name}</div>`, new Vector3(x, -y, 0.4))
      label3d.setLabelStyle(label, 0.04, 'x', 0)
      label.setParent(labelGroup)
      return label
    }
  }

  createRotateBorder() {
    //
    let max = 10
    let rotationBorder1 = this.assets.getResource('rotationBorder1')
    let rotationBorder2 = this.assets.getResource('rotationBorder2')

    let plane01 = new Plane(this, {
      width: max * 1.178,
      needRotate: true,
      rotateSpeed: 0.0005,
      material: new MeshBasicMaterial({
        map: rotationBorder1,
        color: 0x009af4,
        transparent: true,
        opacity: 0.4,
        side: DoubleSide,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
      position: new Vector3(0, 0, 0.28),
    })
    plane01.instance.renderOrder = 6
    plane01.instance.scale.set(0, 0, 0)
    plane01.setParent(this.sceneGroup)
    //
    let plane02 = new Plane(this, {
      width: max * 1.116,
      needRotate: true,
      rotateSpeed: -0.002,
      material: new MeshBasicMaterial({
        map: rotationBorder2,
        color: 0x009af4,
        transparent: true,
        opacity: 0.6,
        side: DoubleSide,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
      position: new Vector3(0, 0, 0.3),
    })
    plane02.instance.renderOrder = 6
    plane02.instance.scale.set(0, 0, 0)
    plane02.setParent(this.sceneGroup)
    this.rotateBorder1 = plane01.instance
    this.rotateBorder2 = plane02.instance
  }
  // 创建轮廓
  createStorke() {
    let mapJsonData = this.assets.getResource('SZStorke')

    const texture = this.assets.getResource('pathLine')
    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping
    texture.repeat.set(1, 1)

    let lines = new Line(this, {
      center: this.pointCenter,
      position: new Vector3(0, 0.15, this.depth + 0.535),
      data: mapJsonData,
      material: new MeshBasicMaterial({
        color: 0x2bc4dc,
        map: texture,
        alphaMap: texture,
        fog: false,
        transparent: true,
        opacity: 1,
        blending: AdditiveBlending,
      }),
      type: 'Line3',
      renderOrder: 22,
    })

    this.sceneGroup.add(lines.lineGroup)
    this.time.on('tick', () => {
      if (this.run) texture.offset.x += 0.002
    })
  }
  geoProjection = (args) => {
    return geoMercator().center(this.pointCenter).scale(1200).translate([0, 0])(args)
  }

  calcUv2(geometry, width, height, minX, minY) {
    const positionAttribute = geometry.attributes.position
    const uvAttribute = geometry.attributes.uv
    const count = geometry.groups[0].count
    for (let i = 0; i < count; i++) {
      const x = positionAttribute.getX(i)
      const y = positionAttribute.getY(i)
      const u = (x - minX) / width
      const v = (y - minY) / height

      uvAttribute.setXY(i, u, v)
    }

    uvAttribute.needsUpdate = true
    geometry.computeVertexNormals()
  }

  update() {
    this.time.on('tick', () => {
      if (this.run) this.interactionManager && this.interactionManager.update()
    })
  }
  // 销毁
  destroy() {
    this.label3d && this.label3d.destroy()
  }
}
