import { geoMercator } from 'd3-geo'
import gsap from 'gsap'
import {
  AdditiveBlending,
  AmbientLight,
  BoxGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  DirectionalLight,
  DirectionalLightHelper,
  DoubleSide,
  Fog,
  Group,
  LineBasicMaterial,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NearestFilter,
  NearestMipMapLinearFilter,
  PlaneGeometry,
  PointLight,
  PointLightHelper,
  PointsMaterial,
  QuadraticBezierCurve3,
  RepeatWrapping,
  SRGBColorSpace,
  Sprite,
  SpriteMaterial,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three'
import { InteractionManager } from 'three.interactive'

import { BGCOLOR_MAP } from '@/common/const/index.ts'
import { BaseMap } from '@/components/MapComponents/map-china/baseMap'
import { ExtrudeMap } from '@/components/MapComponents/map-china/extrudeMap'
import { Line } from '@/components/MapComponents/map-china/line'
import provincesData from '@/components/MapComponents/map-china/provincesData'
import { SZMap } from '@/components/MapComponents/map.js'
import {
  Debug,
  GradientShader,
  Label3d,
  LabelCanvasSprite,
  Mini3d,
  Particles,
  Plane,
  emptyObject,
  getBoundBox,
  transfromMapGeoJSON,
} from '@/mini3d'

export class ChinaMap {
  constructor(self, { mapData }) {
    this.self = self
    this.assets = self.assets
    this.time = self.time
    this.canvas = self.canvas
    this.camera = self.camera
    this.renderer = self.renderer
    this.scene = self.scene
    this.sizes = self.sizes
    this.run = false
    // 中心坐标
    this.pointCenter = [108.55, 34.32]
    this.flyLineCenter = [114.143142, 22.643377]
    this.depth = 5
    // 是否已经点击
    this.clicked = false
    this.labelClicked = false
    this.labelHovering = false
    this.labelClickThresholdPx = 0
    this.labelHitPaddingPx = 0.8
    this.labelHitPaddingMinPx = 0
    this.labelHitPaddingMaxPx = 2
    this.labelHitPaddingZoomBase = 1
    this.debugLabelHitbox = true
    this.debugLabelHitboxCanvas = null
    this.debugLabelHitboxCtx = null
    this.debugMouseClientX = null
    this.debugMouseClientY = null
    this.debugMouseMoveHandler = null
    this.debugMouseLeaveHandler = null
    this.canvasLabelDownHandler = null
    this.canvasLabelMoveHandler = null
    this.canvasLabelLeaveHandler = null
    this._labelRaycastTriggered = false
    this._labelClickCooldownUntil = 0
    this.currentHoveredLabelMesh = null
    this.labelHoverSnapThresholdPx = 10
    this.disableMapAreaHover = false
    this.szmap = null
    this.mapData = mapData
    this.init()
    // 更新
    this.update()
    this.hide()
  }
  init() {
    // 场景组
    this.sceneGroup = new Group()
    this.sceneGroup.visible = false
    this.labelGroup = new Group()
    this.outsideLabelGroup = new Group()
    this.gqGroup = new Group() // 光圈组
    this.provinceNameGroup = new Group()
    this.label3d = new Label3d(this)
    this.sceneGroup.rotateX(-Math.PI / 2)

    this.sceneGroup.add(
      this.labelGroup,
      this.outsideLabelGroup,
      this.gqGroup,
      this.provinceNameGroup,
    )
    this.initLabelHitboxDebugOverlay()
    this.scene.add(this.sceneGroup)
    this.szmap = new SZMap(this.self)
    // 创建底图
    // this.createMapBg()
    // 处理地图
    this.createModel()

    // 创建标签
    this.createMapLabel()
    // 创建飞线
    this.createFlyLine()
    // 创建边框
    this.createBorderGlow()
    //
    this.createNanhaiqundao()
    // 云层移动
    this.createMoveCloud()
  }
  show() {
    this.run = true
    this.sceneGroup.visible = true
    this.sceneGroup.scale.set(0, 0, 0)
  }
  showLabel() {
    this.labelGroup.traverse((label) => {
      label.show && label.show()
    })
    this.outsideLabelGroup.traverse((label) => {
      label.show && label.show()
    })
    this.provinceNameGroup.traverse((label) => {
      label.show && label.show()
    })
  }
  hide() {
    this.run = false
    this.sceneGroup.scale.set(0, 0, 0)
    this.sceneGroup.visible = false
    this.labelGroup.traverse((label) => {
      label.hide && label.hide()
    })
    this.outsideLabelGroup.traverse((label) => {
      label.hide && label.hide()
    })
    this.provinceNameGroup.traverse((label) => {
      label.hide && label.hide()
    })
  }
  initAnimate() {
    this.scene.fog = false
    this.scene.background = null // new Color(0x000000) 去掉背景色
    this.camera.setCamera(false)
    this.sceneGroup.position.set(0, 0, 0)
    this.sceneGroup.scale.set(1, 1, 1)
    this.camera.instance.position.set(
      0.00002366776247217723,
      225.1025284992283,
      0.0002238648924037432,
    )
    this.camera.instance.near = 1
    this.camera.instance.far = 10000
    this.camera.instance.updateProjectionMatrix()
    // 地图首次进入时立即触发光圈动画，避免必须等页面切换/数据更新后才出现
    this.triggerGuangquanAnimation()
    // this.initEnvironment()
    // 创建时间线
    let tl = gsap.timeline()
    // 相机动画
    tl.addLabel('focusMap', 0)
    tl.addLabel('focusMapOpacity', 2.0)
    tl.addLabel('bar', 3.0)
    tl.add(
      gsap.to(this.camera.instance.position, {
        duration: 2.5,
        x: 13.9054061316192135,
        y: 93.47690004910885,
        z: 81.1764201439928,
        ease: 'circ.out',
      }),
    )

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

    // tl.add(
    //   gsap.to(this.flyLineGroup.children[0].material, {
    //     duration: 3,
    //     opacity: 1,
    //     ease: "circ.out",
    //     onStart: () => {
    //       this.flyLineGroup.visible = true
    //     },
    //     onComplete: () => {
    //       this.flyLineFocusGroup.visible = true
    //     },
    //   }),
    //   "focusMapOpacity"
    // )

    this.chinaMesh.mapGroup.traverse((obj) => {
      if (obj.isMesh) {
        tl.add(
          gsap.to(obj.material[0], {
            duration: 1,
            opacity: 1,
            // opacity: 0.2,
            ease: 'circ.out',
          }),
          'focusMapOpacity',
        )
        tl.add(
          gsap.to(obj.position, {
            duration: 1,
            x: 0,
            y: 0,
            z: 0,
            ease: 'circ.out',
          }),
          'focusMapOpacity',
        )
      }
    })
    tl.add(
      gsap.to(this.focusMapSideMaterial, {
        duration: 1,
        opacity: 1,
        ease: 'circ.out',
      }),
      'focusMapOpacity',
    )

    tl.add(
      gsap.to(this.chinaLineMaterial, {
        duration: 0.5,
        delay: 0.3,
        opacity: 0,
      }),
      'focusMapOpacity',
    )
    tl.add(
      gsap.to(this.borderGlow.material, {
        duration: 0.5,
        delay: 0.3,
        opacity: 1,
        onComplete: () => {
          this.createStorke()
          // 添加事件
          this.addEvent()

          this.run = true
        },
      }),
      'focusMapOpacity',
    )
    tl.add(
      gsap.to(this.nanhaiqundao.material, {
        duration: 0.5,
        delay: 0.5,
        opacity: 1,
      }),
      'focusMapOpacity',
    )

    this.allBar.map((item, index) => {
      tl.add(
        gsap.to(item.scale, {
          duration: 1,
          delay: 0.05 * index,
          x: item.userData.scale,
          y: item.userData.scale,
          z: item.userData.scale,
          ease: 'circ.out',
        }),
        'bar',
      )
    })

    this.allProvinceNameLabel.map((item, index) => {
      let element = item.element.querySelector('.provinces-name-label-wrap')

      tl.add(
        gsap.to(element, {
          duration: 0.5,
          delay: 0.05 * index,
          translateY: 0,
          opacity: 1,
          ease: 'circ.out',
        }),
        'bar',
      )
    })
    // 光圈动画统一由 triggerGuangquanAnimation() 控制，确保首屏即出现
  }

  // 初始化环境灯光
  initEnvironment() {
    let sun = new AmbientLight(0xffffff, 2)
    this.scene.add(sun)
    // 方向光
    let directionalLight = new DirectionalLight(0xffffff, 4)
    directionalLight.position.set(-30, 6, -8)
    directionalLight.castShadow = true
    directionalLight.shadow.radius = 20
    directionalLight.shadow.mapSize.width = 1024
    directionalLight.shadow.mapSize.height = 1024
    this.scene.add(directionalLight)

    this.createPointLight({
      color: '#0e81fb',
      intensity: 160,
      distance: 10000,
      x: -3,
      y: 16,
      z: -3,
    })
    this.createPointLight({
      color: '#1f5f7a',
      intensity: 100,
      distance: 100,
      x: -4,
      y: 8,
      z: 43,
    })
  }

  createPointLight(pointParams) {
    // 点光源
    const pointLight = new PointLight(0x1d5e5e, pointParams.intensity, pointParams.distance, 1)
    pointLight.position.set(pointParams.x, pointParams.y, pointParams.z)
    this.scene.add(pointLight)
  }
  // 模型渲染
  createModel() {
    let mapGroup = new Group()
    let focusMapGroup = new Group()
    this.focusMapLightMeshGroup = new Group()
    this.focusMapGroup = focusMapGroup
    // 地图
    let { china, chinaTopLine, chinaMapTopArea } = this.createFocusMap()
    this.chinaMesh = china
    china.setParent(focusMapGroup)
    chinaTopLine.setParent(focusMapGroup)
    chinaMapTopArea.setParent(focusMapGroup)

    focusMapGroup.position.set(0, 0, -5)
    focusMapGroup.scale.set(1, 1, 0)
    focusMapGroup.add(this.focusMapLightMeshGroup)
    mapGroup.add(focusMapGroup)
    // mapGroup.rotateX(-Math.PI / 2);
    mapGroup.position.set(0, 0.2, 0)
    this.sceneGroup.add(mapGroup)
  }

  // 创建焦点地图
  createFocusMap() {
    let mapJsonData = this.assets.getResource('chinaStorke')
    let mapLineJsonData = this.assets.getResource('china')
    let topNormal = this.assets.getResource('topNormal')

    topNormal.wrapS = topNormal.wrapT = RepeatWrapping
    // 地图线
    this.chinaLineMaterial = new LineBasicMaterial({
      color: 0xffffff,
      opacity: 0,
      transparent: true,
      fog: false,
    })
    let [topMaterial, sideMaterial] = this.createFocusMapMaterial()

    this.focusMapTopMaterial = topMaterial
    this.focusMapSideMaterial = sideMaterial

    let china = new ExtrudeMap(this, {
      center: this.pointCenter,
      position: new Vector3(0, 0, 0.06),
      data: mapJsonData,
      depth: this.depth,
      topFaceMaterial: topMaterial,
      sideMaterial: sideMaterial,
      lineMaterial: this.chinaLineMaterial,
      renderOrder: 9,
    })

    // 重新计算uv
    let { boxSize, box3 } = getBoundBox(china.mapGroup)
    this.eventElement = []
    china.mapGroup.children.map((group, index) => {
      group.children.map((mesh) => {
        if (mesh.type === 'Mesh') {
          // 重新计算uv
          this.calcUv2(mesh.geometry, boxSize.x, boxSize.y, box3.min.x, box3.min.y)
        }
      })
    })

    // 中国地图线
    this.chinaTopLineMaterial = new LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      depthTest: false,
      fog: false,
    })
    let chinaTopLine = new Line(this, {
      center: this.pointCenter,
      data: mapLineJsonData,
      // 3e4f73
      material: this.chinaTopLineMaterial,
      renderOrder: 11,
    })
    this.chinaTopLine = chinaTopLine
    chinaTopLine.lineGroup.position.z += this.depth + 0.1

    // 顶部map 点击区域
    let chinaMapTopArea = new BaseMap(this, {
      center: this.pointCenter,
      position: new Vector3(0, 0, this.depth),
      data: mapLineJsonData,
      merge: false,
      material: new MeshBasicMaterial({
        color: new Color('rgb(41,159,255)'),
        transparent: true,
        opacity: 0,
        depthTest: false,
      }),
      renderOrder: 10,
    })
    chinaMapTopArea.mapGroup.children.map((group, index) => {
      group.children.map((mesh) => {
        if (mesh.type === 'Mesh') {
          mesh.material = mesh.material.clone()
          this.eventElement.push(mesh)
        }
      })
    })
    return {
      china,
      chinaTopLine,
      chinaMapTopArea,
    }
  }

  createLightMesh(userData) {
    // 深圳地图
    let focusMapData = this.assets.getResource('china')
    focusMapData = JSON.parse(focusMapData)
    focusMapData.features = focusMapData.features.filter(
      (item) => item.properties.name === userData.name,
    )
    focusMapData = JSON.stringify(focusMapData)

    let { faceHightMaterial, sideHightMaterial } = this.createLightMaterial()

    let focusLightMap = new ExtrudeMap(this, {
      center: this.pointCenter,
      position: new Vector3(0, 0, this.depth),
      data: focusMapData,
      depth: this.depth / 3,
      topFaceMaterial: faceHightMaterial,
      sideMaterial: sideHightMaterial,
      lineMaterial: new LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        depthTest: false,
        fog: false,
      }),
      renderOrder: 12,
      lineRenderOrder: 13,
    })
    focusLightMap.mapGroup.userData.typeName = 'lightMesh'
    let box = getBoundBox(focusLightMap.mapGroup)
    focusLightMap.mapGroup.children.map((group, index) => {
      group.children.map((mesh) => {
        if (mesh.type === 'Mesh') {
          this.calcUv2(mesh.geometry, box.boxSize.x, box.boxSize.y, box.box3.min.x, box.box3.min.y)
        }
      })
    })
    return focusLightMap.mapGroup
  }
  createLightMaterial() {
    let topFace = this.assets.getResource('topFace')
    topFace.colorSpace = SRGBColorSpace
    topFace.wrapS = topFace.wrapT = RepeatWrapping
    topFace.flipY = false
    topFace.repeat.set(1, 1)

    let sideMap = this.assets.getResource('side4')

    let faceHightMaterial = new MeshBasicMaterial({
      map: topFace,
      fog: false,
      transparent: true,
    })
    let sideHightMaterial = new MeshBasicMaterial({
      map: sideMap,
      fog: false,
      transparent: true,
    })

    return { faceHightMaterial, sideHightMaterial }
  }
  // 移除事件
  removeEvent() {
    if (this.interactionManager) {
      ;[...this.eventElement, ...this.labelEventElement].map((mesh) => {
        this.interactionManager.remove(mesh)
      })
      this.interactionManager.dispose()
      this.interactionManager = null
    }
    if (this.canvasLabelDownHandler) {
      this.canvas.removeEventListener('mousedown', this.canvasLabelDownHandler)
      this.canvasLabelDownHandler = null
    }
    if (this.canvasLabelMoveHandler) {
      this.canvas.removeEventListener('mousemove', this.canvasLabelMoveHandler)
      this.canvasLabelMoveHandler = null
    }
    if (this.canvasLabelLeaveHandler) {
      this.canvas.removeEventListener('mouseleave', this.canvasLabelLeaveHandler)
      this.canvasLabelLeaveHandler = null
    }
    this.setHoveredLabelMesh(null, null)
  }
  // 移除高亮网格
  removeLightMesh() {
    if (this.currentSelectMap) {
      this.focusMapLightMeshGroup.traverse((obj) => {
        this.focusMapLightMeshGroup.remove(obj)
        emptyObject(obj)
        this.currentSelectMap = null
      })
    }
  }
  // 添加事件
  addEvent() {
    this.removeEvent()

    // 交互管理器
    if (!this.interactionManager) {
      this.interactionManager = new InteractionManager(
        this.renderer.instance,
        this.camera.instance,
        this.canvas,
      )
    }
    // 创建标签点击事件
    this.createLabelClickEvent()
    // 创建区域点击事件（放在标签事件之后，降低地图面抢点击的概率）
    this.createAreaClickEvent()
  }
  createAreaClickEvent() {
    let objectsHover = []
    const reset = (mesh) => {
      gsap.to(mesh.material, {
        duration: 0.3,
        opacity: 0,
      })
      this.setFocusLabelMove(mesh.userData.adcode, 'down')
      this.setGQMove(mesh.userData.adcode, 'down')
      this.setLabelMove(mesh.userData.adcode, 'down')
    }
    const move = (mesh) => {
      // 网格移动动画
      gsap.to(mesh.material, {
        duration: 0.3,
        opacity: 0,
      })
      this.setFocusLabelMove(mesh.userData.adcode)
      this.setGQMove(mesh.userData.adcode)
      this.setLabelMove(mesh.userData.adcode)
      mesh.traverse((obj) => {
        if (obj.isMesh) {
          obj.renderOrder = 21
        }
      })
    }
    //
    this.currentSelectMap = null
    const removeAndCreateMesh = (event) => {
      this.removeLightMesh()
      // 点击生成高亮网格
      let mesh = this.createLightMesh(event.target.userData)
      this.currentSelectMap = mesh
      this.focusMapLightMeshGroup.add(mesh)
    }
    this.eventElement.map((mesh) => {
      this.interactionManager.add(mesh)

      mesh.addEventListener('mousedown', (event) => {
        console.log('test:', event, this.labelHovering)
        const pointHitLabel = this.findHoverLabelByScreenPoint(event.clientX, event.clientY)
        if (pointHitLabel) {
          this.labelClicked = true
          this._labelRaycastTriggered = true
          this._labelClickCooldownUntil = Date.now() + 120
          this.self.emit('chinaMapLabelClick', pointHitLabel.mesh.userData)
          window.setTimeout(() => {
            this.labelClicked = false
            this._labelRaycastTriggered = false
          }, 120)
          return false
        }
        // 标签优先：鼠标在标签上时不触发区域点击
        if (this.labelHovering) return false
        if (!this.run || this.clicked) return false
        this.clicked = true
        removeAndCreateMesh(event)
        this.self.emit('chinaMapClick', event.target.userData)
      })
      mesh.addEventListener('mouseup', (ev) => {
        this.clicked = false
      })
      mesh.addEventListener('mouseover', (event) => {
        if (!this.run) return false
        if (!objectsHover.includes(event.target.parent)) {
          objectsHover.push(event.target.parent)
        }
        document.body.style.cursor = 'pointer'
        // 仅触发 hover 事件，不在鼠标经过时生成高亮轮廓网格
        this.self.emit('chinaMapMouseover', event, event.target.userData)
      })
      mesh.addEventListener('mouseout', (event) => {
        objectsHover = objectsHover.filter(
          (n) => n.userData.name !== event.target.parent.userData.name,
        )
        if (objectsHover.length > 0) {
          const mesh = objectsHover[objectsHover.length - 1]
        }
        // reset(event.target);
        if (!this.labelHovering) {
          document.body.style.cursor = 'default'
        }
        this.self.emit('chinaMapMouseout', event, event.target.userData)
      })
    })
  }
  /**
   * 设置柱状图移动
   * @param {*} name
   * @param {*} type up-上移  down-下移
   */
  setFocusLabelMove(adcode, type = 'up') {
    this.allBar.map((focusLabelGroup) => {
      if (focusLabelGroup.userData.adcode === adcode) {
        gsap.to(focusLabelGroup.position, {
          duration: 0.3,
          z:
            type === 'up'
              ? focusLabelGroup.userData.position[2] + this.depth / 2 + 0.3
              : focusLabelGroup.userData.position[2],
        })
      }
    })
  }
  /**
   * 设置光圈移动
   * @param {*} name
   * @param {*} type up-上移  down-下移
   */
  setGQMove(adcode, type = 'up') {
    this.allGuangquan.map((group) => {
      if (group.userData.adcode === adcode) {
        gsap.to(group.position, {
          duration: 0.3,
          z:
            type === 'up'
              ? group.userData.position[2] + this.depth / 2 + 0.3
              : group.userData.position[2],
        })
      }
    })
    if (this.flyLineFocusGroup.userData.adcode === adcode) {
      gsap.to(this.flyLineFocusGroup.position, {
        duration: 0.3,
        y:
          type === 'up'
            ? this.flyLineFocusGroup.userData.position[1] + this.depth / 2 + 0.3
            : this.flyLineFocusGroup.userData.position[1],
      })
    }
  }
  // 设置标签移动
  setLabelMove(adcode, type = 'up') {
    ;[...this.allProvinceLabel, ...this.allProvinceNameLabel].map((label) => {
      if (label.userData.adcode === adcode) {
        gsap.to(label.position, {
          duration: 0.3,
          z:
            type === 'up'
              ? label.userData.position[2] + this.depth / 2 + 0.3
              : label.userData.position[2],
        })
      }
    })
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

  createFocusMapMaterial() {
    let topNormal = this.assets.getResource('topNormal')
    topNormal.wrapS = topNormal.wrapT = RepeatWrapping
    topNormal.colorSpace = SRGBColorSpace

    let topMaterial = new MeshBasicMaterial({
      map: topNormal,
      fog: false,
      transparent: true,
      opacity: 0.2,
      side: DoubleSide,
    })

    let sideMap = this.assets.getResource('side').clone()
    sideMap.wrapS = RepeatWrapping
    sideMap.wrapT = RepeatWrapping
    sideMap.repeat.set(1, 0.15)
    // sideMap.offset.y += 0.01;
    let sideMaterial = new MeshStandardMaterial({
      // color: 0xeeeeee,
      map: sideMap,
      fog: false,
      transparent: true, // 如果设置true,侧栏会出现穿透的问题
      opacity: 0,
      side: DoubleSide,
    })
    // this.debug = new Debug(true)
    // this.debug.instance.add(topNormal)
    this.time.on('tick', () => {
      if (this.run) sideMap.offset.y += 0.002
    })
    sideMaterial.onBeforeCompile1 = (shader) => {
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
  // 创建地图标签
  createMapLabel(data = null) {
    let self = this
    let provincesData = data || this.mapData
    const focusLabelGroup = new Group()
    this.focusLabelGroup = focusLabelGroup

    this.allBar = []
    this.allBarMaterial = []
    this.allGuangquan = []
    this.allProvinceLabel = []
    this.allProvinceNameLabel = []
    this.labelEventElement = []
    provincesData.map((item, index) => {
      item.name = item.name
      let [x, y] = this.geoProjection(item.value)
      let mesh = this.createLabelIcon(item, new Vector3(x, -y, this.depth + 1.4))
      this.labelEventElement.push(mesh)

      mesh.renderOrder = 100
      mesh.userData.id = item.id
      mesh.userData.name = item.name
      // 深圳和其他标签缩放值
      mesh.userData.scale = item.start ? 5 : 3
      mesh.scale.set(mesh.userData.scale, mesh.userData.scale, mesh.userData.scale)
      mesh.userData.adcode = item.adcode
      mesh.userData.centroid = item.value
      mesh.userData.center = item.value
      mesh.userData.position = [x, -y, this.depth + 1.4]
      mesh.userData.hitRole = 'icon'
      focusLabelGroup.add(mesh)
      // 深圳和其他标签颜色
      let color = item.start ? 0xfeb817 : 0xffffff
      let guangQuan = this.createQuan(color)
      guangQuan.position.set(x, -y, this.depth + 0.46)
      guangQuan.userData.name = item.name
      guangQuan.userData.adcode = item.adcode
      guangQuan.userData.scale = item.start ? 2.5 : 1.8
      guangQuan.userData.position = [x, -y, this.depth + 0.46]
      guangQuan.userData.id = item.id
      this.gqGroup.add(guangQuan)

      const finalX = x
      const finalY = -y

      const labelPosition = new Vector3(finalX, finalY, this.depth + 4)

      //let nameEmptyLabel = this.labelEmptySprite(item, new Vector3(finalX, finalY, this.depth + 4))
      // let nameLabel = labelNameStyle(item, index, new Vector3(finalX, finalY, this.depth + 4))
      let nameEmptyLabel = this.labelEmptySprite(item, labelPosition)
      let nameLabel = labelNameStyle(item, index, labelPosition)

      // 透明精灵仅用于视觉结构，不参与点击，避免放大命中区域挡住邻近标签
      this.sceneGroup.add(nameEmptyLabel)
      this.allBar.push(mesh)

      this.allGuangquan.push(guangQuan)

      this.allProvinceNameLabel.push(nameLabel)
      if (nameLabel) {
        this.allProvinceNameLabel.push(nameLabel)
      }
    })
    this.sceneGroup.add(focusLabelGroup)

    // 省份城市标签
    // function labelNameStyle(data, index, position) {
    //   let label = self.label3d.create("", "provinces-name-label", true)
    //   const labelStyle = `
    //       background: ${BGCOLOR_MAP[data.type]};
    //       padding: 4px 10px;
    //       box-shadow: 4px 4px 10px rgba(0,0,0,0.6); /* 核心立体投影 */
    //       text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    //       border: 1.5px solid rgba(100, 200, 255, 0.5);
    //       border-radius: 2px;
    //       display: inline-block;
    //       color: #ffffff;
    //   `;
    //   label.init(
    //     `<div class="provinces-name-label ${data.start ? "focus-label" : ""}">
    //         <div style="${labelStyle}"><span>${data.name}</span></div>
    //         <div class="icon"></div>
    //       </div>`,
    //     position
    //   )
    //   self.label3d.setLabelStyle(label, 0.11, "x")
    //   label.setParent(self.provinceNameGroup)
    //   label.userData.adcode = data.adcode
    //   label.userData.name = data.name
    //   label.userData.id = data.id
    //   label.userData.position = [position.x, position.y, position.z]
    //   return label
    // }
    function labelNameStyle(data, index, position) {
      const canvas = document.createElement('canvas')
      const LOGICAL_H = 110
      const FONT_SIZE = 58
      const PADDING_X = 24
      const MIN_LOGICAL_W = 180
      // 根据文字长度自适应宽度，并设置最小宽度，避免所有标签都过宽
      const estimateTextW = Math.max(80, data.name.length * FONT_SIZE)
      const LOGICAL_W = Math.max(MIN_LOGICAL_W, estimateTextW + PADDING_X * 2)
      const rawDpr =
        typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1
      const dpr = Math.min(rawDpr, 3)
      canvas.width = Math.floor(LOGICAL_W * dpr)
      canvas.height = Math.floor(LOGICAL_H * dpr)
      const ctx = canvas.getContext('2d')
      if (!ctx) return null

      // 缩放上下文，后续绘画使用逻辑坐标
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H)

      // 2. 样式参数准备
      const bgColor = BGCOLOR_MAP[data.type]
      const borderColor = 'rgba(100, 200, 255, 0.5)'
      const shadowColor = 'rgba(0, 0, 0, 0.6)'

      const margin = 8 // 留出阴影空间
      const x = margin
      const y = margin
      const w = LOGICAL_W - margin * 2
      const h = LOGICAL_H - margin * 2
      const radius = 4 // 对应 border-radius: 2px

      // 3. 绘制背景矩形 + 投影 (模拟 box-shadow)
      ctx.save()
      // ctx.shadowColor = shadowColor;
      // ctx.shadowBlur = 10;
      // ctx.shadowOffsetX = 4;
      // ctx.shadowOffsetY = 4;

      ctx.fillStyle = bgColor
      ctx.strokeStyle = borderColor
      ctx.lineWidth = 2 // 对应 border: 1.5px

      // 绘制圆角矩形路径
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

      // 4. 绘制文字 (模拟 color & text-shadow)
      ctx.save()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // 文字阴影
      // ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      // ctx.shadowBlur = 4;
      // ctx.shadowOffsetY = 2;

      ctx.fillStyle = '#ffffff'
      ctx.font = `900 ${FONT_SIZE}px Microsoft YaHei, sans-serif` // 根据高度调整字号

      const textX = LOGICAL_W / 2
      const textY = LOGICAL_H / 2
      ctx.fillText(data.name, textX, textY)
      ctx.restore()

      // 5. 创建纹理与材质
      const texture = new CanvasTexture(canvas)
      texture.colorSpace = SRGBColorSpace
      texture.needsUpdate = true
      // 关键：解决缩小后发糊发黑
      texture.minFilter = LinearMipmapLinearFilter
      texture.magFilter = LinearFilter
      texture.premultiplyAlpha = false
      texture.generateMipmaps = true
      // 关键：解决透明边缘黑影
      // texture.premultiplyAlpha = false;

      const material = new SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 1,
        // 让贴图里过于透明的边缘像素直接丢弃，提升文字对比度/清晰度
        alphaTest: 0.001,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      })

      const sprite = new Sprite(material)

      // 6. 设置位置与缩放
      sprite.position.copy(position)
      // 根据实际效果可微调缩放值，尽量保持与原 HTML 标签相近
      // 按画布宽高比动态计算精灵缩放，保证短名字标签更窄
      const baseScaleY = 2.4
      const baseScaleX = baseScaleY * (LOGICAL_W / LOGICAL_H)
      sprite.scale.set(baseScaleX, baseScaleY, 1)
      // 保持 4:1 的比例，基准值可根据地图大小微调
      //const scaleUnit = 0.5;
      //sprite.scale.set(4 * scaleUnit, 1 * scaleUnit, 1);

      // 7. 绑定数据与逻辑 (与原 label3d 逻辑兼容)
      sprite.userData = {
        adcode: data.adcode,
        name: data.name,
        id: data.id,
        position: [position.x, position.y, position.z],
        hitRole: 'text',
      }

      // 控制显示隐藏的扩展方法
      sprite.visible = true
      sprite.show = () => {
        sprite.visible = true
      }
      sprite.hide = () => {
        sprite.visible = false
      }

      // 挂载到对应的 Group
      sprite.renderOrder = 999999
      if (self.provinceNameGroup) {
        self.provinceNameGroup.add(sprite)
      }

      // 如果需要交互，加入事件数组
      if (self.labelEventElement) {
        self.labelEventElement.push(sprite)
      }

      return sprite
    }
  }
  // 创建空白标签
  labelEmptySprite(data, position) {
    let transparentTexture = this.assets.getResource('transparentTexture')
    let sprite = new Sprite(
      new SpriteMaterial({
        map: transparentTexture,
        color: 0xffffff,
        opacity: 0,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    )
    sprite.position.copy(position)
    sprite.scale.set(5.4, 2.5, 1)
    sprite.center = new Vector2(0.5, 0)
    sprite.userData.adcode = data.adcode
    sprite.userData.name = data.name
    sprite.userData.position = [position.x, position.y, position.z]
    sprite.userData.centroid = data.centroid
    sprite.userData.center = data.center
    sprite.userData.id = data.id
    return sprite
  }
  createLabelClickEvent() {
    this.setupCanvasLabelFallback()
    this.labelEventElement.forEach((mesh) => {
      this.interactionManager.add(mesh)

      mesh.addEventListener('mousedown', (event) => {
        console.log(event, this.labelClicked)
        if (this.labelClicked) return false
        // 点击区域与 hover 一致：仅文字标签可触发点击
        if (event.target?.userData?.hitRole !== 'text') return false
        this.labelClicked = true
        this._labelRaycastTriggered = true
        this._labelClickCooldownUntil = Date.now() + 120
        this.self.emit('chinaMapLabelClick', event.target.userData)
      })
      mesh.addEventListener('mouseup', (event) => {
        this.labelClicked = false
        this._labelRaycastTriggered = false
      })
      mesh.addEventListener('mouseover', (event) => {
        if (!this.run) return false
        this.setHoveredLabelMesh(event.target, event)
      })
      mesh.addEventListener('mouseout', (event) => {
        if (this.currentHoveredLabelMesh === event.target) {
          this.setHoveredLabelMesh(null, event)
        }
      })
    })
  }
  setHoveredLabelMesh(nextMesh, event = null) {
    if (this.currentHoveredLabelMesh === nextMesh) return
    const prevMesh = this.currentHoveredLabelMesh
    this.currentHoveredLabelMesh = nextMesh || null
    this.labelHovering = !!this.currentHoveredLabelMesh
    if (prevMesh?.userData) {
      this.self.emit('chinaMapLabelMouseout', event, prevMesh.userData)
    }
    if (this.currentHoveredLabelMesh?.userData) {
      document.body.style.cursor = 'pointer'
      this.self.emit('chinaMapLabelMouseover', event, this.currentHoveredLabelMesh.userData)
    } else {
      document.body.style.cursor = 'default'
    }
  }
  setupCanvasLabelFallback() {
    if (this.canvasLabelDownHandler) {
      this.canvas.removeEventListener('mousedown', this.canvasLabelDownHandler)
    }
    if (this.canvasLabelMoveHandler) {
      this.canvas.removeEventListener('mousemove', this.canvasLabelMoveHandler)
    }
    if (this.canvasLabelLeaveHandler) {
      this.canvas.removeEventListener('mouseleave', this.canvasLabelLeaveHandler)
    }
    this.canvasLabelDownHandler = (event) => {
      if (!this.run || this.labelClicked) return
      if (Date.now() < this._labelClickCooldownUntil) return
      // 射线已经命中标签时，避免重复触发
      if (this._labelRaycastTriggered) {
        this._labelRaycastTriggered = false
        return
      }
      const hit = this.findHoverLabelByScreenPoint(event.clientX, event.clientY)
      if (!hit) return
      this.labelClicked = true
      this.self.emit('chinaMapLabelClick', hit.mesh.userData)
      window.setTimeout(() => {
        this.labelClicked = false
      }, 120)
    }
    this.canvasLabelMoveHandler = (event) => {
      if (!this.run) return
      const hit = this.findHoverLabelByScreenPoint(event.clientX, event.clientY)
      this.setHoveredLabelMesh(hit?.mesh || null, event)
    }
    this.canvasLabelLeaveHandler = (event) => {
      this.setHoveredLabelMesh(null, event)
    }
    this.canvas.addEventListener('mousedown', this.canvasLabelDownHandler)
    this.canvas.addEventListener('mousemove', this.canvasLabelMoveHandler)
    this.canvas.addEventListener('mouseleave', this.canvasLabelLeaveHandler)
  }
  getLabelClickCandidates() {
    return this.labelEventElement.filter((mesh) => mesh && mesh.userData)
  }
  initLabelHitboxDebugOverlay() {
    if (!this.debugLabelHitbox || !this.canvas?.parentNode) return
    if (this.debugLabelHitboxCanvas) return
    const overlay = document.createElement('canvas')
    overlay.style.position = 'absolute'
    overlay.style.left = '0'
    overlay.style.top = '0'
    overlay.style.width = '100%'
    overlay.style.height = '100%'
    overlay.style.pointerEvents = 'none'
    overlay.style.zIndex = '99998'
    this.canvas.parentNode.appendChild(overlay)
    const ctx = overlay.getContext('2d')
    this.debugLabelHitboxCanvas = overlay
    this.debugLabelHitboxCtx = ctx
    this.debugMouseMoveHandler = (event) => {
      this.debugMouseClientX = event.clientX
      this.debugMouseClientY = event.clientY
    }
    this.debugMouseLeaveHandler = () => {
      this.debugMouseClientX = null
      this.debugMouseClientY = null
    }
    this.canvas.addEventListener('mousemove', this.debugMouseMoveHandler)
    this.canvas.addEventListener('mouseleave', this.debugMouseLeaveHandler)
  }
  removeLabelHitboxDebugOverlay() {
    if (this.debugMouseMoveHandler) {
      this.canvas.removeEventListener('mousemove', this.debugMouseMoveHandler)
      this.debugMouseMoveHandler = null
    }
    if (this.debugMouseLeaveHandler) {
      this.canvas.removeEventListener('mouseleave', this.debugMouseLeaveHandler)
      this.debugMouseLeaveHandler = null
    }
    if (this.debugLabelHitboxCanvas?.parentNode) {
      this.debugLabelHitboxCanvas.parentNode.removeChild(this.debugLabelHitboxCanvas)
    }
    this.debugLabelHitboxCanvas = null
    this.debugLabelHitboxCtx = null
  }
  syncLabelHitboxDebugCanvasSize() {
    const overlay = this.debugLabelHitboxCanvas
    if (!overlay) return
    const rect = this.canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const nextW = Math.max(1, Math.floor(rect.width * dpr))
    const nextH = Math.max(1, Math.floor(rect.height * dpr))
    if (overlay.width !== nextW || overlay.height !== nextH) {
      overlay.width = nextW
      overlay.height = nextH
    }
    const ctx = this.debugLabelHitboxCtx
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  getDebugLabelBoundsById() {
    const rect = this.canvas.getBoundingClientRect()
    const grouped = new Map()
    this.getLabelClickCandidates().forEach((mesh) => {
      if (!mesh.visible || mesh.parent?.visible === false) return
      const bounds = this.getMeshScreenBounds(mesh, rect)
      if (!bounds) return
      const id = mesh.userData.id ?? mesh.userData.adcode ?? mesh.userData.name
      if (id === undefined || id === null) return
      if (!grouped.has(id)) {
        grouped.set(id, {
          id,
          name: mesh.userData.name || String(id),
          left: bounds.left,
          right: bounds.right,
          top: bounds.top,
          bottom: bounds.bottom,
        })
        return
      }
      const prev = grouped.get(id)
      prev.left = Math.min(prev.left, bounds.left)
      prev.right = Math.max(prev.right, bounds.right)
      prev.top = Math.min(prev.top, bounds.top)
      prev.bottom = Math.max(prev.bottom, bounds.bottom)
    })
    return Array.from(grouped.values())
  }
  renderLabelHitboxDebugOverlay() {
    if (!this.debugLabelHitbox || !this.debugLabelHitboxCtx || !this.debugLabelHitboxCanvas) return
    this.syncLabelHitboxDebugCanvasSize()
    const ctx = this.debugLabelHitboxCtx
    const rect = this.canvas.getBoundingClientRect()
    ctx.clearRect(0, 0, rect.width, rect.height)
    if (!this.run) return
    const boundsList = this.getDebugLabelBoundsById()
    if (!boundsList.length) return
    const mouseX = this.debugMouseClientX
    const mouseY = this.debugMouseClientY
    boundsList.forEach((bounds) => {
      const x = bounds.left - rect.left
      const y = bounds.top - rect.top
      const w = bounds.right - bounds.left
      const h = bounds.bottom - bounds.top
      const isHover =
        mouseX !== null &&
        mouseY !== null &&
        mouseX >= bounds.left &&
        mouseX <= bounds.right &&
        mouseY >= bounds.top &&
        mouseY <= bounds.bottom
      ctx.fillStyle = isHover ? 'rgba(255, 163, 26, 0.18)' : 'rgba(0, 210, 255, 0.1)'
      ctx.strokeStyle = isHover ? 'rgba(255, 163, 26, 0.95)' : 'rgba(0, 210, 255, 0.75)'
      ctx.lineWidth = isHover ? 2 : 1
      ctx.fillRect(x, y, w, h)
      ctx.strokeRect(x, y, w, h)
      ctx.font = '12px sans-serif'
      ctx.fillStyle = isHover ? 'rgba(255, 186, 102, 1)' : 'rgba(120, 230, 255, 0.95)'
      // 调试文字隐藏：仅保留命中框显示
    })
  }
  getDynamicLabelHitPaddingPx() {
    const zoom = this.camera?.instance?.zoom || 1
    const baseZoom = this.labelHitPaddingZoomBase || 1
    // 缩小视图(zoom 更小)时扩大点击容错；放大时收敛到更精准的命中范围
    const ratio = baseZoom / Math.max(zoom, 0.01)
    const dynamicPadding = this.labelHitPaddingPx * Math.pow(ratio, 0.7)
    return Math.min(
      this.labelHitPaddingMaxPx,
      Math.max(this.labelHitPaddingMinPx, dynamicPadding),
    )
  }
  toScreenPoint(worldPosition, rect) {
    return {
      x: ((worldPosition.x + 1) / 2) * rect.width + rect.left,
      y: ((1 - worldPosition.y) / 2) * rect.height + rect.top,
    }
  }
  getMeshScreenBounds(mesh, rect) {
    const centerWorld = new Vector3()
    const worldScale = new Vector3()
    mesh.getWorldPosition(centerWorld)
    mesh.getWorldScale(worldScale)
    const projectedCenter = centerWorld.clone().project(this.camera.instance)
    if (projectedCenter.z < -1 || projectedCenter.z > 1) return null

    const scaleX = Math.abs(worldScale.x || 0)
    const scaleY = Math.abs(worldScale.y || 0)
    const halfScaleX = scaleX / 2
    const halfScaleY = scaleY / 2

    // Sprite 始终朝向相机，使用相机 right / up 向量估算其屏幕包围盒
    const cameraRight = new Vector3()
    const cameraUp = new Vector3()
    cameraRight.setFromMatrixColumn(this.camera.instance.matrixWorld, 0).normalize()
    cameraUp.setFromMatrixColumn(this.camera.instance.matrixWorld, 1).normalize()

    const centerAnchor = mesh.center || new Vector2(0.5, 0.5)
    const centerOffsetX = (0.5 - centerAnchor.x) * scaleX
    const centerOffsetY = (0.5 - centerAnchor.y) * scaleY
    const trueCenterWorld = centerWorld
      .clone()
      .add(cameraRight.clone().multiplyScalar(centerOffsetX))
      .add(cameraUp.clone().multiplyScalar(centerOffsetY))

    const projectedTrueCenter = trueCenterWorld.clone().project(this.camera.instance)
    if (projectedTrueCenter.z < -1 || projectedTrueCenter.z > 1) return null

    const rightWorld = trueCenterWorld.clone().add(cameraRight.clone().multiplyScalar(halfScaleX))
    const upWorld = trueCenterWorld.clone().add(cameraUp.clone().multiplyScalar(halfScaleY))
    const projectedRight = rightWorld.project(this.camera.instance)
    const projectedUp = upWorld.project(this.camera.instance)

    const centerScreen = this.toScreenPoint(projectedTrueCenter, rect)
    const rightScreen = this.toScreenPoint(projectedRight, rect)
    const upScreen = this.toScreenPoint(projectedUp, rect)

    // 尽量贴合标签真实尺寸，仅保留极小下限避免数值抖动
    const halfWidth = Math.max(1, Math.abs(rightScreen.x - centerScreen.x))
    const halfHeight = Math.max(1, Math.abs(upScreen.y - centerScreen.y))

    const padding = this.getDynamicLabelHitPaddingPx()
    return {
      left: centerScreen.x - halfWidth - padding,
      right: centerScreen.x + halfWidth + padding,
      top: centerScreen.y - halfHeight - padding,
      bottom: centerScreen.y + halfHeight + padding,
      centerX: centerScreen.x,
      centerY: centerScreen.y,
      mesh,
    }
  }
  findLabelByScreenPoint(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect()
    let nearestInBounds = null
    this.getLabelClickCandidates().forEach((mesh) => {
      if (!mesh.visible || mesh.parent?.visible === false) return
      const bounds = this.getMeshScreenBounds(mesh, rect)
      if (!bounds) return
      const dx = bounds.centerX - clientX
      const dy = bounds.centerY - clientY
      const distance = Math.hypot(dx, dy)
      const inBounds =
        clientX >= bounds.left &&
        clientX <= bounds.right &&
        clientY >= bounds.top &&
        clientY <= bounds.bottom
      if (inBounds && (!nearestInBounds || distance < nearestInBounds.distance)) {
        nearestInBounds = { mesh: bounds.mesh, distance }
      }
    })
    if (nearestInBounds) return nearestInBounds
    return null
  }
  getLabelHoverGroups(rect) {
    const groups = new Map()
    const allCandidates = this.getLabelClickCandidates()
    const textCandidates = allCandidates.filter((mesh) => mesh.userData?.hitRole === 'text')
    const hoverCandidates = textCandidates.length > 0 ? textCandidates : allCandidates
    hoverCandidates.forEach((mesh) => {
      if (!mesh.visible || mesh.parent?.visible === false) return
      const bounds = this.getMeshScreenBounds(mesh, rect)
      if (!bounds) return
      const key = mesh.userData?.id ?? mesh.userData?.adcode ?? mesh.userData?.name
      if (key === undefined || key === null) return
      const area = Math.max(0, bounds.right - bounds.left) * Math.max(0, bounds.bottom - bounds.top)
      const prev = groups.get(key)
      if (!prev) {
        groups.set(key, {
          key,
          mesh,
          left: bounds.left,
          right: bounds.right,
          top: bounds.top,
          bottom: bounds.bottom,
          centerX: bounds.centerX,
          centerY: bounds.centerY,
          area,
        })
        return
      }
      prev.left = Math.min(prev.left, bounds.left)
      prev.right = Math.max(prev.right, bounds.right)
      prev.top = Math.min(prev.top, bounds.top)
      prev.bottom = Math.max(prev.bottom, bounds.bottom)
      prev.centerX = (prev.left + prev.right) / 2
      prev.centerY = (prev.top + prev.bottom) / 2
      if (area > prev.area) {
        prev.mesh = mesh
        prev.area = area
      }
    })
    return Array.from(groups.values())
  }
  findHoverLabelByScreenPoint(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect()
    const groups = this.getLabelHoverGroups(rect)
    let nearestInBounds = null
    let nearestByDistance = null
    groups.forEach((group) => {
      const inBounds =
        clientX >= group.left &&
        clientX <= group.right &&
        clientY >= group.top &&
        clientY <= group.bottom
      const distance = Math.hypot(group.centerX - clientX, group.centerY - clientY)
      if (inBounds && (!nearestInBounds || distance < nearestInBounds.distance)) {
        nearestInBounds = { mesh: group.mesh, distance }
      }
      if (!nearestByDistance || distance < nearestByDistance.distance) {
        nearestByDistance = { mesh: group.mesh, distance }
      }
    })
    if (nearestInBounds) return nearestInBounds
    if (nearestByDistance && nearestByDistance.distance <= this.labelHoverSnapThresholdPx) {
      return nearestByDistance
    }
    return null
  }
  // 创建标签图标
  createLabelIcon(data, position) {
    let icon = this.assets.getResource('point01')
    let icon2 = this.assets.getResource('point02')
    icon.colorSpace = icon2.colorSpace = SRGBColorSpace
    let sprite = new Sprite(
      new SpriteMaterial({
        map: data.name === '深圳市' ? icon2 : icon,
        transparent: true,
        depthTest: false,
        fog: false,
      }),
    )

    sprite.scale.set(0, 0, 0)
    sprite.position.copy(position)
    this.scene.add(sprite)
    return sprite
  }
  // 创建标签底座光圈
  createQuan(color = 0xffffff) {
    const guangquan1 = this.assets.getResource('guangquan1')
    const guangquan2 = this.assets.getResource('guangquan2')
    let geometry = new PlaneGeometry(2, 2)

    let material1 = new MeshBasicMaterial({
      color: color,
      map: guangquan1,
      alphaMap: guangquan1,
      opacity: 1,
      transparent: true,
      depthTest: false,
      fog: false,
    })
    let material2 = new MeshBasicMaterial({
      color: color,
      map: guangquan2,
      alphaMap: guangquan2,
      opacity: 1,
      transparent: true,
      depthTest: false,
      fog: false,
    })
    let mesh1 = new Mesh(geometry, material1)
    let mesh2 = new Mesh(geometry, material2)
    mesh1.renderOrder = 24
    mesh2.renderOrder = 24

    mesh2.position.z -= 0.001
    mesh1.scale.set(0, 0, 0)
    mesh2.scale.set(0, 0, 0)
    this.quanGroup = new Group()
    this.quanGroup.add(mesh1, mesh2)

    this.time.on('tick', (delta) => {
      if (this.run) mesh1.rotation.z += delta * 2
    })
    return this.quanGroup
  }

  // 创建地图背景
  createMapBg() {
    let geometry = new PlaneGeometry(400, 400)
    const texture = this.assets.getResource('chinaMapBg')
    texture.colorSpace = SRGBColorSpace
    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping
    texture.repeat.set(1, 1)
    let material = new MeshBasicMaterial({
      map: texture,
      opacity: 1,
      transparent: true,
      blending: AdditiveBlending,
    })
    let mesh = new Mesh(geometry, material)
    mesh.scale.set(1, 1, 1)
    mesh.position.set(-8.9, -6.97, 0.05)
    this.sceneGroup.add(mesh)
  }
  // 创建发光边框
  createBorderGlow() {
    // 计算缩放系数
    const k = 100 / 120

    // 1. 调整几何体原始大小 (129 * k ≈ 107.5)
    let geometry = new PlaneGeometry(129 * k, 129 * k)

    const texture = this.assets.getResource('chinaGlowNew')
    // ... 贴图设置保持不变 ...

    let material = new MeshBasicMaterial({
      map: texture,
      color: 0x009af4,
      transparent: true,
      // ... 其他材质设置保持不变 ...
    })

    let mesh = new Mesh(geometry, material)

    // 2. 缩放倍数通常保持比例即可，但如果视觉上有偏差，也需要微调
    mesh.scale.set(1.13, 1.17, 1.11)

    // 3. 关键：调整位置 (原始位置 * k)
    // -8.95 * 0.833 ≈ -7.46
    // -6.49 * 0.833 ≈ -5.41
    // 注意：Z 轴通常代表深度，如果你的地图深度没变，Z 可能不需要乘 k，或者微调
    mesh.position.set(-8.95 * k, -6.49 * k, 5.11)

    mesh.renderOrder = 100
    this.borderGlow = mesh
    this.sceneGroup.add(mesh)
  }
  // 创建
  createNanhaiqundao() {
    let geometry = new PlaneGeometry(17, 23)
    const texture = this.assets.getResource('nanhaiqundao')
    texture.colorSpace = SRGBColorSpace
    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping
    texture.repeat.set(1, 1)
    let material = new MeshBasicMaterial({
      map: texture,
      opacity: 0,
      fog: false,
      side: DoubleSide,
      transparent: true,
    })
    let mesh = new Mesh(geometry, material)
    let point = [126.28785174, 21.93199205]
    let [x, y] = this.geoProjection(point)
    mesh.scale.set(0.5, 0.5, 0.5)
    mesh.position.set(x, -y, this.depth)

    this.nanhaiqundao = mesh
    this.sceneGroup.add(mesh)
  }

  // 创建飞线
  createFlyLine(data = null) {
    this.flyLineGroup = new Group()
    this.flyLineGroup.visible = false

    this.sceneGroup.add(this.flyLineGroup)

    const texture = this.assets.getResource('flyLine')
    texture.colorSpace = SRGBColorSpace
    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping
    const tubeRadius = 0.1
    const tubeSegments = 32
    const tubeRadialSegments = 8
    const closed = false
    let [centerX, centerY] = this.geoProjection(this.flyLineCenter)
    let centerPoint = new Vector3(centerX, -centerY, 0)
    const material = new MeshBasicMaterial({
      map: texture,
      alphaMap: texture,
      color: 0xff9800,
      transparent: true,
      fog: false,
      opacity: 0,
      depthTest: false,
      blending: AdditiveBlending,
    })
    this.time.on('tick', () => {
      if (this.run) texture.offset.x -= 0.003
    })
    const provincesData = data || this.mapData
    provincesData.map((city) => {
      let [x, y] = this.geoProjection(city.value)
      let point = new Vector3(x, -y, 0)
      const center = new Vector3()
      center.addVectors(centerPoint, point).multiplyScalar(0.5)
      center.setZ(15)
      const curve = new QuadraticBezierCurve3(centerPoint, center, point)
      const tubeGeometry = new TubeGeometry(
        curve,
        tubeSegments,
        tubeRadius,
        tubeRadialSegments,
        closed,
      )
      const mesh = new Mesh(tubeGeometry, material)
      mesh.position.set(0, 0, this.depth + 0.4)
      mesh.renderOrder = 21
      this.flyLineGroup.add(mesh)
    })
    this.createFlyLineFocus()
  }
  createFlyLineFocus() {
    this.flyLineFocusGroup = new Group()
    this.flyLineFocusGroup.visible = false
    this.sceneGroup.add(this.flyLineFocusGroup)
    let [x, y] = this.geoProjection(this.flyLineCenter)
    this.flyLineFocusGroup.position.set(x, -y, this.depth + 0.47)
    this.flyLineFocusGroup.userData.name = '深圳总部' // 设置光圈的名字
    this.flyLineFocusGroup.userData.adcode = 440000 //设置光圈的adcode
    this.flyLineFocusGroup.userData.position = [x, -y, this.depth + 0.47] //设置光圈的位置

    const flyLineFocus = this.assets.getResource('guangquan1')
    const geometry = new PlaneGeometry(5, 5)
    const material = new MeshBasicMaterial({
      color: 0xff9800,
      map: flyLineFocus,
      alphaMap: flyLineFocus,
      transparent: true,
      fog: false,
      depthTest: false,
    })
    const mesh = new Mesh(geometry, material)
    mesh.renderOrder = 30
    mesh.scale.set(0, 0, 0)
    const mesh2 = mesh.clone()
    mesh2.material = material.clone()
    this.flyLineFocusGroup.add(mesh, mesh2)
    // gsap.to(mesh.material, {
    //   opacity: 0,
    //   repeat: -1,
    //   yoyo: false,
    //   duration: 1,
    // })
    // gsap.to(mesh.scale, {
    //   x: 2,
    //   y: 2,
    //   z: 2,
    //   repeat: -1,
    //   yoyo: false,
    //   duration: 1,
    // })
    // gsap.to(mesh2.material, {
    //   delay: 0.5,
    //   opacity: 0,
    //   repeat: -1,
    //   yoyo: false,
    //   duration: 1,
    // })
    // gsap.to(mesh2.scale, {
    //   delay: 0.5,
    //   x: 2,
    //   y: 2,
    //   z: 2,
    //   repeat: -1,
    //   yoyo: false,
    //   duration: 1,
    // })
  }

  // 创建轮廓
  createStorke() {
    if (this.storkeLine) return false
    let mapJsonData = this.assets.getResource('chinaStorke')
    const texture = this.assets.getResource('pathLine').clone()
    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping
    texture.repeat.set(1, 1)

    this.storkeLine = new Line(this, {
      center: this.pointCenter,
      position: new Vector3(0, 0, this.depth + 0.5),
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
      renderOrder: 101,
    })
    this.sceneGroup.add(this.storkeLine.lineGroup)
    this.time.on('tick', () => {
      if (this.run) texture.offset.x += 0.002
    })
  }

  createMoveCloud() {
    this.moveCloudGroup = new Group()
    this.moveCloudGroup.move = () => {
      this.szmap.show()
      gsap.to('.clouds-wrap .cloud', {
        translateX: '-100%',
        duration: 3,
        stagger: 0.025,
        ease: 'power1.inOut',
      })
      gsap.to(this.camera.instance.position, {
        x: 0,
        y: 0,
        z: 0,
        duration: 1.5,
        ease: 'power1.inOut',
        onStart: () => {
          this.run = false
        },
        onComplete: () => {
          this.hide()
          this.removeLightMesh()
          this.sceneGroup.visible = false
          this.sceneGroup.scale.set(0, 0, 0)
          this.szmap.showLabel()
          setTimeout(() => {
            this.szmap.initAnimate()
          }, 0)
        },
      })
    }
  }
  updateData(newData) {
    // 1. 清理旧的
    if (this.focusLabelGroup) this.sceneGroup.remove(this.focusLabelGroup)
    if (this.provinceNameGroup) this.provinceNameGroup.clear() // 这里的 clear 取决于你的封装

    // 移除所有旧的 HTML DOM
    this.allProvinceNameLabel.forEach((label) => {
      if (label.element) label.element.remove()
    })
    this.removeMapLabels()
    this.removeFlyLines()

    // 2. 更新数据源并重新创建
    this.mapData = newData
    // console.log('地图数据----')
    // console.log(newData)
    this.createMapLabel(newData)
    // 触发光圈动画
    this.triggerGuangquanAnimation()
  }

  // 销毁组及其子元素
  disposeGroup(group) {
    if (!group) return

    group.traverse((obj) => {
      if (obj.geometry) {
        obj.geometry.dispose()
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((material) => material.dispose())
        } else {
          obj.material.dispose()
        }
      }
    })
  }
  // 移除地图标签
  removeMapLabels() {
    console.log('Removing map labels')

    // 移除标签组
    if (this.focusLabelGroup) {
      this.sceneGroup.remove(this.focusLabelGroup)
      this.disposeGroup(this.focusLabelGroup)
      this.focusLabelGroup = null
    }

    // 移除光圈组
    if (this.gqGroup) {
      this.sceneGroup.remove(this.gqGroup)
      this.disposeGroup(this.gqGroup)
      this.gqGroup = new Group()
      this.sceneGroup.add(this.gqGroup)
      console.log('Recreated gqGroup')
    }

    // 移除省份名称组
    if (this.provinceNameGroup) {
      // 确保所有子元素被移除
      while (this.provinceNameGroup.children.length > 0) {
        const child = this.provinceNameGroup.children[0]
        this.provinceNameGroup.remove(child)
        // 清理标签资源
        if (child.destroy) {
          child.destroy()
        }
      }
      this.sceneGroup.remove(this.provinceNameGroup)
      this.disposeGroup(this.provinceNameGroup)
      this.provinceNameGroup = new Group()
      this.sceneGroup.add(this.provinceNameGroup)
      console.log('Recreated provinceNameGroup')
    }

    // 清除所有可能的标签元素
    // 遍历sceneGroup，移除所有标签相关的元素
    const elementsToRemove = []
    this.sceneGroup.traverse((child) => {
      if (child.userData && (child.userData.adcode || child.userData.name)) {
        elementsToRemove.push(child)
      }
    })

    elementsToRemove.forEach((element) => {
      this.sceneGroup.remove(element)
      if (element.destroy) {
        element.destroy()
      } else {
        this.disposeGroup(element)
      }
    })

    // 清除数组
    this.allBar = []
    this.allBarMaterial = []
    this.allGuangquan = []
    this.allProvinceLabel = []
    this.allProvinceNameLabel = []
    this.labelEventElement = []

    console.log('Map labels removed')
  }

  // 移除飞线
  removeFlyLines() {
    // 移除飞线组
    if (this.flyLineGroup) {
      this.sceneGroup.remove(this.flyLineGroup)
      this.disposeGroup(this.flyLineGroup)
      this.flyLineGroup = null
    }

    // 移除飞线焦点组
    if (this.flyLineFocusGroup) {
      this.sceneGroup.remove(this.flyLineFocusGroup)
      this.disposeGroup(this.flyLineFocusGroup)
      this.flyLineFocusGroup = null
    }
  }
  // 触发光圈动画
  triggerGuangquanAnimation() {
    console.log('Triggering guangquan animation')

    // 确保光圈初始缩放为0
    this.allGuangquan.forEach((guangquan, index) => {
      guangquan.children.forEach((child) => {
        child.scale.set(0, 0, 0)
      })
    })

    // 使用GSAP创建动画时间线
    let tl = gsap.timeline()

    // 为每个光圈添加动画
    // this.allGuangquan.map((item, index) => {
    //   tl.add(
    //     gsap.to(item.children[0].scale, {
    //       duration: 0.5,
    //       delay: 0.05 * index,
    //       x: item.userData.scale,
    //       y: item.userData.scale,
    //       z: item.userData.scale,
    //       ease: "circ.out",
    //     })
    //   )
    //   tl.add(
    //     gsap.to(item.children[1].scale, {
    //       duration: 0.5,
    //       delay: 0.05 * index,
    //       x: item.userData.scale,
    //       y: item.userData.scale,
    //       z: item.userData.scale,
    //       ease: "circ.out",
    //     })
    //   )
    // })
    // 为每个光圈添加动画，减少延迟，使动画更快出现
    this.allGuangquan.forEach((item, index) => {
      // 为第一个光圈立即开始动画
      const delay = index * 0.02 // 减少延迟时间，从0.05改为0.02

      // 第一个光圈的动画
      gsap.to(item.children[0].scale, {
        duration: 0.4, // 减少动画持续时间，从0.5改为0.4
        delay: delay,
        x: item.userData.scale,
        y: item.userData.scale,
        z: item.userData.scale,
        ease: 'circ.out',
      })

      // 第二个光圈的动画
      gsap.to(item.children[1].scale, {
        duration: 0.4, // 减少动画持续时间，从0.5改为0.4
        delay: delay + 0.1, // 稍微错开第二个光圈的动画
        x: item.userData.scale,
        y: item.userData.scale,
        z: item.userData.scale,
        ease: 'circ.out',
      })
    })

    console.log('Guangquan animation triggered')
  }
  goBack() {
    gsap.to('.clouds-wrap .cloud', {
      translateX: '-110%',
      duration: 0,
    })
    gsap.to('.clouds-wrap .cloud', {
      translateX: '100%',
      duration: 3,
      stagger: 0.025,
      ease: 'power1.inOut',
    })
    gsap.to(this.camera.instance.position, {
      x: 13.9054061316192135,
      y: 93.47690004910885,
      z: 81.1764201439928,
      duration: 1.5,
      delay: 1.5,
      ease: 'power1.inOut',
      onStart: () => {
        this.sceneGroup.visible = true
        this.sceneGroup.scale.set(1, 1, 1)
        this.sceneGroup.position.set(0, 0, 0)
        this.removeLightMesh()
        this.showLabel()
        // this.addEvent();
      },
      onComplete: () => {
        this.camera.instance.near = 1
        this.camera.instance.far = 10000
        this.camera.instance.updateProjectionMatrix()
        this.removeLightMesh()
        this.run = true
      },
    })
    gsap.to(
      { time: 0 },
      {
        time: 1,
        duration: 1.5,

        onComplete: () => {
          this.scene.fog = false
          // this.scene.background = new Color(0x000000)
          this.scene.background = null
          this.removeLightMesh()
          this.camera.instance.near = 1
          this.camera.instance.far = 10000
          this.camera.instance.updateProjectionMatrix()
          this.szmap.hide()
        },
      },
    )
  }
  geoProjection = (args) => {
    return geoMercator().center(this.pointCenter).scale(100).translate([0, 0])(args)
  }
  // 更新
  update() {
    this.time.on('tick', () => {
      this.renderLabelHitboxDebugOverlay()
      if (this.run) {
        this.interactionManager && this.interactionManager.update()
      }
    })
  }
  // 销毁
  destroy() {
    this.removeLabelHitboxDebugOverlay()
    this.label3d && this.label3d.destroy()
    this.stats && this.stats.dom && document.body.removeChild(this.stats.dom)
    this.interactionManager && this.interactionManager.dispose()
    this.szmap && this.szmap.destroy()
  }
}
