import {
  PlaneGeometry,
  Mesh,
  RepeatWrapping,
  AmbientLight,
  DirectionalLight,
  DirectionalLightHelper,
  DoubleSide,
  Color,
  Float32BufferAttribute,
  PointsMaterial,
  Points,
  BufferGeometry,
  SRGBColorSpace,
  Vector3,
  Sprite,
  SpriteMaterial,
  MeshBasicMaterial,
  AdditiveBlending,
  SphereGeometry,
  Line,
  LineBasicMaterial,
  Group,
  Vector2,
  LineSegments,
  BufferAttribute,
  CubicBezierCurve3,
  CatmullRomCurve3,
  TubeGeometry,
  Fog,
  ShaderMaterial,
  MultiplyBlending,
  NormalBlending,
  MeshPhongMaterial,
} from "three"
import {
  Mini3d,
  Globe,
  latLongToVector3,
  RippleCirle,
  LabelCanvasSprite,
  transfromMapGeoJSON,
  getBoundBox,
} from "@/mini3d"
import stats from "three/examples/jsm/libs/stats.module"
import { Assets } from "./assets"
import { DiffuseShader } from "@/components/MapComponents/globe/DiffuseShader"
import countryFlyLineData from "@/components/MapComponents/globe/countryFlyLineData"
import { PathLine } from "@/components/MapComponents/globe/PathLine"
import { createCountryMergeSphereLine, checkDistance } from "@/components/MapComponents/globe/utils"
import { generateMap } from "@/components/MapComponents/globe/CountryMesh"
import { InteractionManager } from "three.interactive"
import gsap from "gsap"
import { SZMap } from "@/components/MapComponents/map.js"
import { ChinaMap } from "@/components/MapComponents/map-china"
// import { ChinaMapNew as ChinaMap } from "@/components/MapComponents/map-china-new"
export class World extends Mini3d {
  constructor(canvas, { mapData }) {
    super(canvas, { isOrthographic: true })

    this.camera.instance.position.set(0, 52.382497908315344, 295.39139106088675)
    this.camera.instance.lookAt(0, 0, 0)
    this.camera.instance.updateProjectionMatrix()
    this.renderer.instance.setClearColor(0x000000, 0)
    this.renderer.postprocessing = false
    this.chinaMap = null

    // this.camera.controls.enabled = false
    // 让页面滚动条优先，避免滚轮被 3D 视图拦截
    this.camera.controls.enableZoom = false
    this.camera.controls.enablePan = false
    this.camera.controls.enableRotate = false
    // this.time.on("tick", () => {
    //   console.log(this.camera.instance.position)
    // })
    this.initEnvironment()
    this.initAssets(() => {
      this.chinaMap = new ChinaMap(this, { mapData })
      // this.chinaMap.initAnimate();
      this.initModel()
      // this.initAnimate()
      this.createMoveCloud()
      this.addEvent()
      // 触发渲染完成事件
      this.emit("renderCompleted")
    })
  }
  initAnimate() {
    let tl = new gsap.timeline({ repeat: 0 })
    tl.addLabel("globeRotate", 0)
    tl.addLabel("globeScale", 2)
    // 地球旋转
    tl.add(
      gsap.to(this.globe.instance.rotation, {
        duration: 4,
        y: Math.PI,
        ease: "power1.inOut",
      })
    )
    // 地球移动
    tl.add(
      gsap.to(this.globe.instance.position, {
        duration: 1,
        x: -70,
        y: -100,
        ease: "power1.inOut",
        delay: 0.5,
      }),
      "globeScale"
    )
    // 地球缩放
    tl.add(
      gsap.to(this.globe.instance.scale, {
        duration: 1.5,
        x: 2.2,
        y: 2.2,
        z: 2.2,
        ease: "power1.inOut",
        onComplete: () => {
          // 开启中国地图描边
          this.storkePath.run = true
        },
      }),
      "globeScale"
    )
  }

  // 初始化环境灯光
  initEnvironment() {
    let sun = new AmbientLight(0xffffff, 4)
    this.scene.add(sun)
    this.sun = sun
    // 方向光
    let directionalLight = new DirectionalLight(0xffffff, 6)
    directionalLight.position.set(238, 90, -8)
    // 辅助对象
    let directionalLightHelp = new DirectionalLightHelper(directionalLight, 200)
    this.scene.add(directionalLight)
  }
  initAssets(onLoadCallback) {
    let assets = new Assets(onLoadCallback)
    this.assets = assets.instance
  }

  // 模型渲染
  initModel() {
    const earthAtmos = this.assets.getResource("earthAtmos")
    const earthNight = this.assets.getResource("earthNight")
    const earthNormal = this.assets.getResource("earthNormal")
    const earthSpecular = this.assets.getResource("earthSpecular")
    const highLight = this.assets.getResource("highLight")
    highLight.colorSpace = SRGBColorSpace
    earthAtmos.colorSpace = SRGBColorSpace
    let globe = new Globe(this, {
      globeColor: 0xffffff, // 0xb5c8f1,
      globeImage: earthAtmos,
      globeNightImage: earthNight,
      normalImage: earthNormal,
      normalScale: new Vector2(1, 1),
      specularImage: earthSpecular,
      atmosphereColor: new Color("#396ee0"),
    })
    globe.instance.rotation.y = -1 * Math.PI
    globe.instance.scale.set(0.8, 0.8, 0.8)
    globe.setParent(this.scene)
    globe.instance.position.z = 60
    this.globe = globe
    let gaoguang = new Sprite(
      new SpriteMaterial({
        color: 0x396ee0,
        side: DoubleSide,
        map: highLight,
        transparent: true,
        alphaMap: highLight,
        depthTest: false,
        blending: AdditiveBlending,
        // blending: NormalBlending,
      })
    )
    gaoguang.scale.set(100 * 2.5, 100 * 2.5, 0)
    gaoguang.renderOrder = 2
    this.globe.add(gaoguang)
    this.createAtmosphere({
      radius: 100,
      atmosphereColor: new Color("#396ee0"),
    })
    this.createStars()
    this.createGrid()
    this.createCloud()
    this.createCountryLine()

    let wallGroup = this.createChinaWall()
    let { chinaMeshBgMaterial } = this.createChinaMeshBg()
    let { chinaMeshsGroup } = this.createChinaMesh()
    let chinaLine = this.createChinaLine()
    this.chinaLine = chinaLine
    let { chinaTopLine, chinaTopLineMaterial } = this.createTopStorke()
    let rippleGroup = this.createRippleCirle()
    this.rippleGroup = rippleGroup
    globe.add(rippleGroup)
    wallGroup.add(chinaLine, chinaTopLine)

    this.createStorke(() => {
      gsap.to(wallGroup.scale, {
        x: 1,
        y: 1,
        z: 1,
        ease: "power1",
        duration: 2,
        onComplete: () => {
          this.createArcAll()
          wallGroup.add(chinaMeshsGroup)
        },
      })
      gsap.to(this.chinaLine.material, { opacity: 0.2, delay: 1.7 })
      gsap.to(this.line3.material, { opacity: 1, delay: 1.7 })
      // gsap.to(chinaMeshsMaterial, { opacity: 0.2, delay: 1.7 });
      gsap.to(chinaMeshBgMaterial, { opacity: 1, delay: 1.7 })
      gsap.to(chinaTopLineMaterial, { opacity: 1, delay: 1.7 })
      wallGroup.visible = true
    })
  }
  // 创建大气层
  createAtmosphere({ radius, atmosphereColor }) {
    const huiguang = this.assets.getResource("globeHuiguang")

    const material = new SpriteMaterial({
      map: huiguang,
      color: atmosphereColor,
      side: DoubleSide,
      transparent: true,
      alphaMap: huiguang,
      depthWrite: false,
      // blending: AdditiveBlending,
    })
    const sprite = new Sprite(material)
    if (this.renderer.postprocessing) {
      sprite.scale.set(radius * 2.5, radius * 2.5, radius * 2.5)
    } else {
      sprite.scale.set(radius * 3.5, radius * 3.5, radius * 3.5)
    }
    this.globe.add(sprite)
  }
  // 创建墙
  createChinaWall() {
    let wallGroup = new Group()
    // 路径
    let mapJsonData = this.assets.getResource("chinaStorke")
    mapJsonData = transfromMapGeoJSON(mapJsonData)
    let coordinates = []
    mapJsonData.features[0].geometry.coordinates[0].map((coords) => {
      coords.map((cood) => {
        let { x, y, z } = latLongToVector3(...cood, 110)
        coordinates.push(x, y, z)
      })
    })

    let geoJson = this.assets.getResource("chinaStorke")
    let worldData = transfromMapGeoJSON(geoJson)
    for (let i = 0; i < 40; i++) {
      let line = createCountryMergeSphereLine(100 + i * 0.1, worldData, {
        color: 0x496185,
        transparent: true,
        opacity: 0.5,
        // opacity: 0.5,
        // depthWrite: false,
        // depthTest: false,
      })
      // line.renderOrder = 2
      wallGroup.add(line)
    }

    let line3 = createCountryMergeSphereLine(104.2, worldData, {
      color: 0xcaeeff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
    })
    line3.renderOrder = 100
    this.line3 = line3

    wallGroup.add(line3)
    this.globe.add(wallGroup)
    this.wallGroup = wallGroup
    wallGroup.scale.set(0.7, 0.7, 0.7)

    return wallGroup
  }
  createChinaMeshBg() {
    let chinaGlow = this.assets.getResource("chinaGlow")
    chinaGlow.wrapS = chinaGlow.wrapT = RepeatWrapping
    chinaGlow.colorSpace = SRGBColorSpace
    let geometry = new SphereGeometry(103.9, 100, 100)
    let chinaMeshBgMaterial = new MeshBasicMaterial({
      // color: 0x37a6ff,
      map: chinaGlow,
      transparent: true,
      side: DoubleSide,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
    })
    let mesh = new Mesh(geometry, chinaMeshBgMaterial)
    mesh.renderOrder = 98
    this.globe.add(mesh)
    return { chinaMeshBgMaterial }
  }
  // 创建中国网格
  createChinaMesh() {
    // 路径
    let mapJsonData = this.assets.getResource("china")
    mapJsonData = transfromMapGeoJSON(mapJsonData)
    let chinaMeshs = generateMap(mapJsonData, 103.92)
    let chinaMeshsGroup = new Group()
    chinaMeshsGroup.add(...chinaMeshs)
    let { boxSize, box3 } = getBoundBox(chinaMeshsGroup)
    let chinaMeshsMaterial = new MeshBasicMaterial({
      color: 0x37a6ff,
      transparent: true,
      side: DoubleSide,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
    })
    let defaultMaterial = chinaMeshsMaterial.clone()
    let lightMaterial = chinaMeshsMaterial.clone()
    let clickMaterial = chinaMeshsMaterial.clone()
    defaultMaterial.opacity = 0
    lightMaterial.opacity = 0.4
    clickMaterial.opacity = 0.5
    lightMaterial.color = new Color("rgb(41,159,255)")
    clickMaterial.color = new Color(0xffffff)
    this.chinaMeshObj = {
      eventElement: [],
      defaultMaterial: defaultMaterial,
      lightMaterial: lightMaterial,
      clickMaterial: clickMaterial,
    }
    chinaMeshsGroup.traverse((obj) => {
      if (obj.isMesh) {
        this.chinaMeshObj.eventElement.push(obj)
        obj.material = chinaMeshsMaterial
        obj.renderOrder = 99
        this.calcUv2(obj.geometry, boxSize.x, boxSize.y, box3.min.x, box3.min.y)
      }
    })
    return { chinaMeshsGroup, chinaMeshsMaterial }
  }

  calcUv2(geometry, width, height, minX, minY) {
    const positionAttribute = geometry.attributes.position
    const uvAttribute = geometry.attributes.uv
    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i)
      const y = positionAttribute.getY(i)

      const u = (x - minX) / width
      const v = (y - minY) / height

      uvAttribute.setXY(i, u, v)
    }

    uvAttribute.needsUpdate = true
    geometry.computeVertexNormals()
  }

  // 创建云层
  createCloud() {
    const CLOUDS_ALT = 1.01
    const CLOUDS_ROTATION_SPEED = -0.04 // deg/frame
    const earthClouds = this.assets.getResource("earthClouds")
    const geometry = new SphereGeometry(100 * CLOUDS_ALT, 75, 75)
    const material = new MeshBasicMaterial({
      color: 0xffffff,
      map: earthClouds,
      transparent: true,
      opacity: 0.2,
      depthTest: false,
    })
    const mesh = new Mesh(geometry, material)
    this.globe.add(mesh)
    this.time.on("tick", () => {
      mesh.rotation.y += (CLOUDS_ROTATION_SPEED * Math.PI) / 180
    })
  }
  // 创建光柱
  createLightPillar(size, color) {
    const group = new Group()
    const texture = this.assets.getResource("lightPillar")
    let rate = 41 / 200 // 图片宽高比
    let height = size / rate // 通过传入的尺寸，计算高度
    const geometry = new PlaneGeometry(size, height)
    geometry.rotateX(Math.PI / 2) //光柱高度方向旋转到z轴上
    geometry.translate(0, 0, height / 2) //平移使光柱底部与XOY平面重合
    const material = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: DoubleSide,
      depthWrite: false,
      depthTest: false,
      blending: AdditiveBlending,
      color: color,
    })
    const mesh = new Mesh(geometry, material)
    mesh.renderOrder = 110
    const mesh2 = mesh.clone()
    mesh2.rotation.z = Math.PI / 2
    group.add(mesh, mesh2)
    return group
  }

  // 创建圆环中心点
  createPointLight(size, color) {
    const texture = this.assets.getResource("pointLight")
    const geometry = new PlaneGeometry(size, size)
    const material = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      color: color,
      blending: AdditiveBlending,
    })
    const mesh = new Mesh(geometry, material)
    mesh.renderOrder = 110
    return mesh
  }
  // 创建波动圆环
  createRippleCirle() {
    this.labelMeshObj = {
      eventElement: [],
      defaultColor: new Color("rgb(57,110,224)"),
      lightColor: new Color(0xffff00),
      clickColor: new Color(0x00ffff),
      focusColor: new Color(0xff6666),
    }
    let rippleGroup = new Group()
    rippleGroup.visible = false
    const gData = countryFlyLineData.map((item, index) => ({
      lat: item.centroid[0],
      lng: item.centroid[1],
      color: item.name === "深圳" ? this.labelMeshObj.focusColor : this.labelMeshObj.defaultColor,
      name: item.name,
      adcode: item.adcode,
      // color: colors[index % 3],
    }))

    gData.forEach((data, index) => {
      let R = 105

      let rippleCirle = new RippleCirle(this, {
        number: data.name === "深圳" ? 5 : 3,
        radius: data.name === "深圳" ? 2.5 : 1.5,
        frequency: 2,
        color: data.color,
      })
      rippleCirle.instance.userData = data
      this.labelMeshObj.eventElement.push(rippleCirle.instance)
      rippleCirle.setParent(rippleGroup)
      rippleCirle.instance.traverse((obj) => {
        if (obj.name === "CircleLine") {
          obj.renderOrder = 110
        }
      })
      let p = latLongToVector3(data.lat, data.lng, R)
      rippleCirle.setPosition(new Vector3(p.x, p.y, p.z))
      // mesh姿态设置
      // mesh在球面上的法线方向(球心和球面坐标构成的方向向量)
      var coordVec3 = new Vector3(p.x, p.y, p.z).normalize()
      // mesh默认在XOY平面上，法线方向沿着z轴new THREE.Vector3(0, 0, 1)
      var meshNormal = new Vector3(0, 0, 1)
      // 四元数属性.quaternion表示mesh的角度状态
      //.setFromUnitVectors();计算两个向量之间构成的四元数值
      rippleCirle.instance.quaternion.setFromUnitVectors(meshNormal, coordVec3)

      let point = this.createPointLight(4, data.color)
      rippleCirle.instance.add(point)
      let lightPillar = this.createLightPillar(3, data.color)
      rippleCirle.instance.add(lightPillar)
      rippleCirle.instance.userData = {
        name: data.name,
        adcode: data.adcode,
      }
    })

    return rippleGroup
  }
  removeEvent() {
    // 先销毁
    if (this.interactionManager) {
      this.labelMeshObj.eventElement.map((mesh) => {
        this.interactionManager.remove(mesh)
      })
      this.interactionManager && this.interactionManager.dispose()
    }
  }
  addEvent() {
    this.removeEvent()
    // 交互管理器
    this.interactionManager = new InteractionManager(this.renderer.instance, this.camera.instance, this.canvas)
    this.eventAction()
    this.addLabelEvent()
    this.addChinaMeshEvent()
  }
  eventAction() {
    this.labelEventAction = {
      reset: (mesh) => {
        // 还原颜色

        this.chinaMeshObj.eventElement.map((item) => {
          this.chinaMeshEventAction.reset(item)
        })
      },
      over: (mesh) => {
        // 设置发光颜色

        this.chinaMeshObj.eventElement.map((item) => {
          if (item.userData.adcode === mesh.userData.adcode) {
            this.chinaMeshEventAction.over(item)
          }
        })
      },
      click: (mesh) => {
        // 设置发光颜色
        // mesh.traverse((obj) => {
        //   if (obj.isMesh) {
        //     obj.material.color = this.labelMeshObj.clickColor
        //   }
        // })
      },
    }
    this.chinaMeshEventAction = {
      reset: (mesh) => {
        // 还原颜色
        mesh.traverse((obj) => {
          if (obj.isMesh) {
            obj.material = this.chinaMeshObj.defaultMaterial.clone()
          }
        })
      },
      over: (mesh) => {
        // 设置发光颜色
        mesh.traverse((obj) => {
          if (obj.isMesh) {
            obj.material = this.chinaMeshObj.clickMaterial.clone()
          }
        })
      },
      click: (mesh) => {
        // 设置发光颜色
        mesh.traverse((obj) => {
          if (obj.isMesh) {
            obj.material = this.chinaMeshObj.clickMaterial.clone()
          }
        })
      },
    }
  }
  addLabelEvent() {
    let objectsHover = []

    this.labelMeshObj.eventElement.map((mesh) => {
      this.interactionManager.add(mesh)

      mesh.addEventListener("mousedown", (event) => {
        if (this.clicked) return false
        this.clicked = true
        this.emit("labelClick", event.target.userData)
        this.labelEventAction.click(event.target)
      })
      mesh.addEventListener("mouseup", (ev) => {
        this.clicked = false
      })
      mesh.addEventListener("mouseover", (event) => {
        if (!objectsHover.includes(event.target)) {
          objectsHover.push(event.target)
        }
        document.body.style.cursor = "pointer"
        this.labelEventAction.over(event.target)
      })
      mesh.addEventListener("mouseout", (event) => {
        objectsHover = objectsHover.filter((n) => n.userData.name !== event.target.userData.name)
        if (objectsHover.length > 0) {
          const mesh = objectsHover[objectsHover.length - 1]
        }
        this.labelEventAction.reset(event.target)
        document.body.style.cursor = "default"
      })
    })
  }
  addChinaMeshEvent() {
    let objectsHover = []

    this.chinaMeshObj.eventElement.map((mesh) => {
      this.interactionManager.add(mesh)

      mesh.addEventListener("mousedown", (event) => {
        if (this.clicked) return false
        this.clicked = true
        this.emit("chinaMeshClick", event.target.userData)
        this.chinaMeshEventAction.click(event.target)
      })
      mesh.addEventListener("mouseup", (ev) => {
        this.clicked = false
      })
      mesh.addEventListener("mouseover", (event) => {
        if (!objectsHover.includes(event.target)) {
          objectsHover.push(event.target)
        }
        document.body.style.cursor = "pointer"
        this.chinaMeshEventAction.over(event.target)
      })
      mesh.addEventListener("mouseout", (event) => {
        objectsHover = objectsHover.filter((n) => n.userData.name !== event.target.userData.name)
        if (objectsHover.length > 0) {
          const mesh = objectsHover[objectsHover.length - 1]
        }
        this.chinaMeshEventAction.reset(event.target)
        document.body.style.cursor = "default"
      })
    })
  }
  // 创建星空
  createStars() {
    const starsGeometry = [new BufferGeometry(), new BufferGeometry()]
    const vertices1 = []
    const vertices2 = []
    const vertex = new Vector3()
    for (let i = 0; i < 250; i++) {
      vertex.y = Math.random() * 2 - 1
      vertex.z = Math.random() * 2 - 1
      vertex.multiplyScalar(20)

      vertices1.push(vertex.x, vertex.y, vertex.z)
    }
    for (let i = 0; i < 1500; i++) {
      vertex.x = Math.random() * 2 - 1
      vertex.y = Math.random() * 2 - 1
      vertex.z = Math.random() * 2 - 1
      vertex.multiplyScalar(10)

      vertices2.push(vertex.x, vertex.y, vertex.z)
    }

    starsGeometry[0].setAttribute("position", new Float32BufferAttribute(vertices1, 3))
    starsGeometry[1].setAttribute("position", new Float32BufferAttribute(vertices2, 3))
    const starsMaterials = [
      new PointsMaterial({ color: 0x9c9c9c, size: 2, sizeAttenuation: false }),
      new PointsMaterial({ color: 0x9c9c9c, size: 1, sizeAttenuation: false }),
      new PointsMaterial({ color: 0x838383, size: 1, sizeAttenuation: false }),
      new PointsMaterial({ color: 0x5a5a5a, size: 2, sizeAttenuation: false }),
      new PointsMaterial({ color: 0x5a5a5a, size: 1, sizeAttenuation: false }),
    ]
    for (let i = 10; i < 30; i++) {
      const stars = new Points(starsGeometry[i % 2], starsMaterials[i % 6])

      stars.rotation.x = Math.random() * 10
      stars.rotation.y = Math.random() * 10
      stars.rotation.z = Math.random() * 10
      stars.scale.setScalar(i * 10)

      stars.matrixAutoUpdate = false
      stars.updateMatrix()
      this.stars = stars
      this.scene.add(stars)
    }
  }
  createChinaLine() {
    let geoJson = this.assets.getResource("china")
    let worldData = transfromMapGeoJSON(geoJson)
    // 100.08
    let line = createCountryMergeSphereLine(103.91, worldData, {
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      // opacity: 0.2,
      depthWrite: false,
      depthTest: false,
    })
    line.renderOrder = 99
    line.name = "chinaLine"
    // this.globe.add(line)

    return line
  }
  // 创建国家线
  createCountryLine() {
    let geoJson = this.assets.getResource("world")
    let worldData = transfromMapGeoJSON(geoJson)
    let line = createCountryMergeSphereLine(100.1, worldData, {
      color: 0xffffff,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    })
    this.countryLine = line
    this.globe.add(line)
  }
  // 创建国家贴合标签
  createCountryNameLabel() {
    let coutryNameGroup = new Group()
    // LabelCanvasSprite
    let dataMap = [...countryFlyLineData]
    let labelSprite = new LabelCanvasSprite()
    dataMap.map((item, index) => {
      let R = 105

      let { x, y, z } = latLongToVector3(item.centroid[0], item.centroid[1] - 1, R)
      let label = labelSprite.createSpriteLabel({
        font: "bold 30px 微软雅黑",
        name: item.name,
        position: new Vector3(x, y, z),
        width: 200,
        height: 100,
        scale: 1,
        opacity: 0,
        isSprite: false,
      })
      label.material.depthTest = false
      label.renderOrder = 110
      gsap.to(label.material, { opacity: 1, delay: index / dataMap.length })
      coutryNameGroup.add(label)
    })
    this.globe.add(coutryNameGroup)
  }
  // 创建弧线
  createArcAll() {
    let dataMap = [...countryFlyLineData]
    let china = dataMap[0]
    dataMap.splice(0, 1)
    let globeRadius = 105
    let lineBufferDivisions = 25
    let arcAllVerticesArray = []
    let arcRocketDetailsArray = []
    let _this = this
    /**
     *  1.创建组，承载弧线ALL
     */
    let arcAllObject = new Group()
    arcAllObject.name = "arcAll"
    const geoProjection = (item = []) => {
      let pos = latLongToVector3(...item, globeRadius)
      return new Vector3(pos.x, pos.y, pos.z)
    }
    /**
     *  2.循环构建所有弧线的点和透明度信息
     */
    for (let i = 0; i < dataMap.length; i++) {
      // 开始点
      var startPoint = geoProjection([china.centroid[0], china.centroid[1]])
      // 结束点
      var endPoint = geoProjection([dataMap[i].centroid[0], dataMap[i].centroid[1]])
      // 距离
      var distance = 1 + 0.005 * checkDistance(startPoint, endPoint)
      // 中间点
      var middlePoint = new Vector3()
      middlePoint.addVectors(startPoint, endPoint)
      // 归一化 计算中间点
      middlePoint.normalize().multiplyScalar(globeRadius * distance)
      // v1
      var vDistance = 1 + 0.005 * checkDistance(startPoint, middlePoint)
      var v1 = new Vector3()
      v1.addVectors(startPoint, middlePoint)
      v1.normalize().multiplyScalar(globeRadius * vDistance)
      // v2
      var v2 = new Vector3()
      v2.addVectors(middlePoint, endPoint)
      v2.normalize().multiplyScalar(globeRadius * vDistance)
      // 根据以下4点 构建三维三次贝塞尔曲线
      // startPoint – 起点
      // v1 – 第一个控制点
      // v2 – 第二个控制点
      // endPoint – 终点
      var curve = new CubicBezierCurve3(startPoint, v1, v2, endPoint)
      // 将曲线分成lineBufferDivisions这么多的点
      var points = curve.getPoints(lineBufferDivisions)
      // 将点插入到
      for (let p = 0; p < lineBufferDivisions; p++) {
        arcAllVerticesArray.push(points[p])
        arcAllVerticesArray.push(points[p + 1])
        arcRocketDetailsArray.push({ alpha: 0 })
        arcRocketDetailsArray.push({ alpha: 0 })
      }
    }

    /**
     *  3.创建弧线
     */
    let arcAllBufferGeometry = new BufferGeometry()

    // 定义shader材质
    let arcAllMaterial = new LineBasicMaterial({
      linewidth: 1,
      color: new Color("#ffffff"),
      blending: AdditiveBlending,
      // depthWrite: false,
      // fog: false, // 受fog影响
      opacity: 1,
      transparent: true,
    })
    // 设置几何体的位置信息和透明度信息
    var posArr = new Float32Array(3 * arcAllVerticesArray.length)
    var alphaArr = new Float32Array(arcAllVerticesArray.length)
    for (let c = 0; c < arcAllVerticesArray.length; c++) {
      posArr[3 * c] = arcAllVerticesArray[c].x
      posArr[3 * c + 1] = arcAllVerticesArray[c].y
      posArr[3 * c + 2] = arcAllVerticesArray[c].z
      alphaArr[c] = 0
    }
    arcAllBufferGeometry.setAttribute("position", new BufferAttribute(posArr, 3))
    // 创建弧线all并添加到场景中
    let arcAllMesh = new LineSegments(arcAllBufferGeometry, arcAllMaterial)
    arcAllObject.add(arcAllMesh)
    arcAllObject.visible = false
    this.globe.add(arcAllObject)

    // Rock
    let arcRocketMaterial = new LineBasicMaterial({
      color: 0xffffff,
      blending: AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      fog: false,
      opacity: 0.5,
      transparent: true,
    })
    arcRocketMaterial.onBeforeCompile = (shader) => {
      shader.uniforms = {
        ...shader.uniforms,
        color: {
          value: new Color("#ffffff"),
        },
      }
      shader.vertexShader = shader.vertexShader.replace(
        "void main() {",
        /* glsl */ `
          attribute float alpha;
              varying float vAlpha;
  
          void main() {
            vAlpha = alpha;
                `
      )
      shader.fragmentShader = shader.fragmentShader.replace(
        "void main() {",
        /* glsl */ `
            uniform vec3 color;
            varying float vAlpha;
            void main() {
          `
      )
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <opaque_fragment>",
        /* glsl */ `
  
                #ifdef OPAQUE
                diffuseColor.a = 1.0;
                #endif
  
                #ifdef USE_TRANSMISSION
                diffuseColor.a *= material.transmissionAlpha;
                #endif
  
                gl_FragColor = vec4( outgoingLight, diffuseColor.a );
                gl_FragColor = vec4(  color, diffuseColor.a * vAlpha );
                // gl_FragColor = vec4(color , diffuseColor.a );
                `
      )
    }
    let arcRocketObject = new Group()
    arcRocketObject.name = "Rocket"
    let arcRocketeMesh = arcAllMesh.clone()
    arcRocketeMesh.geometry = arcAllMesh.geometry.clone()
    arcRocketeMesh.geometry.setAttribute("position", new BufferAttribute(posArr, 3))
    arcRocketeMesh.geometry.setAttribute("alpha", new BufferAttribute(alphaArr, 1))
    arcRocketeMesh.material = arcRocketMaterial
    arcRocketeMesh.renderOrder = 100
    arcRocketObject.add(arcRocketeMesh)
    arcRocketObject.visible = true
    this.globe.add(arcRocketObject)
    // 光圈显示
    this.rippleGroup.visible = true
    this.createCountryNameLabel()
    /**
     *  4.弧线动画
     */
    let arcRocketAnimation = null
    arcRocketAnimation = gsap.timeline({
      paused: true, // 开始暂停
      repeat: 0, // 重复执行
      onUpdate: function () {
        renderRocketSnake() //
      },
      onComplete: () => {
        // 创建飞线
        this.createFlyLine(dataMap, arcRocketeMesh, lineBufferDivisions)
      },
    })
    arcRocketAnimation.fromTo(
      arcRocketDetailsArray,
      { alpha: 0 },
      { alpha: 1, duration: 0.25, stagger: 0.025, duration: 0.5 }, // 必须加上stagger，多个物体才能按队列运动
      0
    )

    arcRocketAnimation.timeScale(2) //设置动画速率  1-默认   2-快速   0.5-慢速

    function renderRocketSnake() {
      var detail = null
      var attr = arcRocketeMesh.geometry.attributes
      for (let i = 0; i < arcRocketDetailsArray.length; i++) {
        detail = arcRocketDetailsArray[i]
        attr.alpha.array[i] = detail.alpha
        attr.alpha.needsUpdate = true
      }
    }

    startAnimate()

    function startAnimate() {
      // 暂停时间轴
      arcRocketAnimation.pause()
      // 曲线的attributes
      var attr = arcRocketeMesh.geometry.attributes
      // 设置透明度0

      for (var a = 0; a < arcRocketDetailsArray.length; a++) {
        attr.alpha.array[a] = 0
      }
      // 透明度需要更新
      attr.alpha.needsUpdate = true
      // 隐藏

      arcRocketObject.visible = true
      arcRocketAnimation.play(0)
    }
  }
  createFlyLine(dataMap, arcRocketeMesh, lineBufferDivisions) {
    // 几条飞线的点数据[[vector3],[],[]]
    let flyLineData = []
    // arc的顶点数组
    let flyALLPosition = arcRocketeMesh.geometry.attributes.position.array
    // 一条线的粒子数量
    let numSize = lineBufferDivisions * 2
    // 将float32转为vector3数据
    let allPoints = []
    for (let i = 0; i < flyALLPosition.length; i += 3) {
      let x = flyALLPosition[i]
      let y = flyALLPosition[i + 1]
      let z = flyALLPosition[i + 2]
      allPoints.push(new Vector3(x, y, z))
    }
    // 分割成多条线条数据
    dataMap.map((item, index) => {
      let lineData = allPoints.slice(index * numSize, numSize * (index + 1))
      flyLineData.push(lineData)
    })

    // 贴图
    const texture = this.assets.getResource("pathLine").clone()
    texture.wrapS = texture.wrapT = RepeatWrapping
    texture.repeat.set(1, 1)
    const material = new MeshBasicMaterial({
      color: new Color("rgb(57,110,224)"), //0xffffff, //0x2bc4dc,
      map: texture,
      alphaMap: texture,
      fog: false,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      opacity: 0,
      blending: AdditiveBlending,
    })
    this.flyLineMaterial = material
    this.flyLineArr = []
    flyLineData.map((lineData) => {
      let points = lineData // 获取一段点数据
      let curve = new CatmullRomCurve3(points) // 将点转为曲线
      let option = {
        segments: 32,
        radius: 0.2, // 大小
        radialSegments: 8,
      }
      const tubeGeometry = new TubeGeometry(curve, option.segments, option.radius, option.radialSegments, false)
      const mesh = new Mesh(tubeGeometry, material)
      mesh.renderOrder = 110
      this.flyLineArr.push(mesh)
      this.globe.add(mesh)
    })
    // 辉光出现
    this.chinaLineHuiGuangShow()

    gsap.to(this.flyLineMaterial, { opacity: 1, ease: "power1.inOut" })
    this.time.on("tick", (delta, elapsedTime) => {
      material.opacity += delta

      if (material.opacity > 1) {
        material.opacity = 1
      }
      texture.offset.x += 0.4 * delta
    })
  }
  // 中国地图顶部辉光出现
  chinaLineHuiGuangShow() {
    if (this.renderer.postprocessing) {
      let params = { opacity: 0 }
      gsap.to(params, {
        opacity: 0.6,
        duration: 1,
        onUpdate: () => {
          this.effect.blendMode.opacity.value = params.opacity
        },
      })
      this.effect.resolution.height = 720
    }
  }
  // 创建地球网格
  createGrid() {
    const grid = this.assets.getResource("grid")
    const gridBlack = this.assets.getResource("gridBlack")
    gridBlack.wrapS = gridBlack.wrapT = grid.wrapS = grid.wrapT = RepeatWrapping
    grid.repeat.set(320, 320)
    gridBlack.repeat.set(320, 320)
    let geometry = new SphereGeometry(100.1, 100, 100)

    let material = new MeshBasicMaterial({
      color: 0x6e879d,
      map: grid,
      alphaMap: gridBlack,
      transparent: true,

      opacity: 0,
      blending: AdditiveBlending,
    })
    new DiffuseShader({
      material,
      time: this.time,
      size: 520,

      diffuseSpeed: 150.0, // 扩散速度
      diffuseColor: 0xffffff, //0x506f8a, // 扩散颜色
      diffuseHeight: 820.0, // 扩散圆环宽度
      diffuseStart: 110,
    })
    let points = new Mesh(geometry, material)
    this.globe.add(points)
  }
  // 创建轮廓
  createStorke(completeCallback) {
    // 贴图
    const texture = this.assets.getResource("pathLine").clone()
    texture.wrapS = texture.wrapT = RepeatWrapping
    texture.repeat.set(0.25, 0.25)
    // 路径
    let mapJsonData = this.assets.getResource("chinaStorke")
    mapJsonData = JSON.parse(mapJsonData)

    // 数据
    // 格式 [{geometry: {type: '', coordinates: [[[x,y]]] }}]
    let data = mapJsonData.features.map((path) => {
      return {
        geometry: path.geometry,
      }
    })

    let pathLine = new PathLine(this, {
      data: data,
      texture: texture,
      renderOrder: 21,
      speed: 0.15,
      radius: 0.2,
      segments: 256 * 10,
      radialSegments: 4,
      customRunCallback: function (delta, elapsedTime, texture) {
        if (texture.offset.x > 1) {
          texture.offset.x = 1
          this.run = false
          completeCallback && completeCallback()
        }
        texture.offset.x += this.options.speed * delta
      },
      material: new MeshBasicMaterial({
        color: 0xffffff, //0x2bc4dc,
        map: texture,
        alphaMap: texture,
        fog: false,
        transparent: true,
        opacity: 1,
        blending: AdditiveBlending,
      }),
    })
    pathLine.run = false
    // 设置父级
    pathLine.setParent(this.globe)
    this.storkePath = pathLine
    // 隐藏
    // pathLine.visible = false;
  }
  // 设置中国顶部边线
  createTopStorke() {
    // 贴图
    const texture = this.assets.getResource("flowY").clone()
    texture.wrapS = texture.wrapT = RepeatWrapping
    // texture.repeat.set(0.25, 0.25)
    // 路径
    let mapJsonData = this.assets.getResource("chinaStorke")
    mapJsonData = JSON.parse(mapJsonData)

    // 数据
    // 格式 [{geometry: {type: '', coordinates: [[[x,y]]] }}]
    let data = mapJsonData.features.map((path) => {
      return {
        geometry: path.geometry,
      }
    })
    let material = new MeshBasicMaterial({
      color: 0xffffff, //0x2bc4dc,
      map: texture,
      alphaMap: texture,
      fog: false,
      transparent: true,
      opacity: 0,
      blending: AdditiveBlending,
    })
    let pathLine = new PathLine(this, {
      data: data,
      texture: texture,
      renderOrder: 102,
      speed: 0.2,
      radius: 0.2,
      segments: 256 * 10,
      radialSegments: 4,
      globeRadius: 104,
      material: material,
    })
    pathLine.run = false
    // 设置父级
    return { chinaTopLine: pathLine.instance, chinaTopLineMaterial: material }
  }
  createMoveCloud() {
    this.chinaMap.show()
    this.globe.instance.visible = false
    this.stars.visible = false

    setTimeout(() => {
      this.chinaMap.showLabel()
      this.chinaMap.initAnimate()
    }, 0)
    /*
    this.moveCloudGroup = new Group()
    this.moveCloudGroup.move = () => {
      // 地球缩放
      gsap.to(this.globe.instance.scale, {
        x: 13,
        y: 13,
        z: 13,
        duration: 2,
        delay: 0.5,
        ease: "power1.inOut",
      })
      // 国家线隐藏
      gsap.to(this.countryLine.material, {
        opacity: 0,
        duration: 2,
      })

      gsap.to(".clouds-wrap .cloud", {
        translateX: "110%",
        duration: 0,
      })
      gsap.to(".clouds-wrap .cloud", {
        translateX: "-100%",
        duration: 3,
        stagger: 0.025,
        ease: "power1.inOut",
      })
      gsap.to(
        { time: 0 },
        {
          time: 1,
          duration: 1.5,
          ease: "power1.inOut",
          onComplete: () => {
            // 中国地图显示
            this.chinaMap.show()
            this.globe.instance.visible = false
            this.stars.visible = false

            setTimeout(() => {
              this.chinaMap.showLabel()
              this.chinaMap.initAnimate()
            }, 0)
          },
        }
      )
    }*/
  }
  goBack() {
    gsap.to(".clouds-wrap .cloud", {
      translateX: "-110%",
      duration: 0,
    })
    gsap.to(".clouds-wrap .cloud", {
      translateX: "100%",
      duration: 3,
      stagger: 0.025,
      ease: "power1.inOut",
    })
    gsap.to(this.globe.instance.scale, {
      duration: 1.5,
      x: 2.2,
      y: 2.2,
      z: 2.2,
      delay: 1.5,
      ease: "power1.inOut",
      onStart: () => {
        this.camera.setCamera(true)
        this.camera.instance.position.set(0, 52.382497908315344, 295.39139106088675)
        this.camera.instance.updateProjectionMatrix()
        this.globe.instance.visible = true
        // 返回全国后保持滚轮用于页面滚动
        this.camera.controls.enableZoom = false
        this.camera.controls.enablePan = false
        this.camera.controls.enableRotate = false
        this.stars.visible = true
      },
      onComplete: () => {
        // this.addEvent();
        this.chinaMap.hide()
      },
    })

    gsap.to(
      { time: 0 },
      {
        time: 1,
        duration: 1.5,
        onComplete: () => {
          this.scene.fog = null
          this.scene.background = null

          this.chinaMap.hide()
        },
      }
    )
  }

  // 暴露给外部调用的更新接口
  updateMapData(newData) {
    if (this.chinaMap) {
      this.chinaMap.updateData(newData);
    }
  }

  // 更新
  update() {
    super.update()
    this.stats && this.stats.update()
    this.interactionManager && this.interactionManager.update()
  }
  // 销毁
  destroy() {
    super.destroy()
    this.stats && document.body.removeChild(this.stats.dom)
    this.interactionManager && this.interactionManager.dispose()
    this.chinaMap && this.chinaMap.destroy()
  }
}
