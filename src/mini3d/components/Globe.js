import {
  Group,
  SphereGeometry,
  Vector3,
  Mesh,
  MeshPhongMaterial,
  SRGBColorSpace,
  Vector2,
  Color,
  Sprite,
  SpriteMaterial,
  DoubleSide,
  AdditiveBlending,
  MeshStandardMaterial,
} from "three"
import { ProxyData } from "../utils"
import { createGlowMesh } from "@/mini3d"
import { gsap } from "gsap"
export class Globe {
  constructor(self, options) {
    this.self = self
    this.instance = new Group()
    this.instance.rotation.offset = {
      x: 0,
      y: 0,
    }
    this.mouse = {
      prevX: 0,
      prevY: 0,
      down: false,
    }
    this.globeObj = null
    this.options = Object.assign(
      {},
      {
        radius: 100,
        drag: false,
        globeColor: 0xffffff,
        globeImage: null,
        globeNightImage: null,
        normalImage: null,
        normalScale: new Vector2(1, 1),
        bumpImage: null,
        bumpScale: 4,
        specularImage: null,
        showAtmosphere: true,
        atmosphereColor: "lightskyblue",
        atmosphereAltitude: 0.15,
        atmospherePower: 3.5,
      },
      options
    )
    this._proxyData()
    this._init()
    this._addEvent()
  }
  _proxyData() {
    const props = {
      globeColor: {
        default: this.options.globeColor || 0xffffff,
        onChange: (value) => {
          console.log(value)
          this.globeObj.material.color = value
        },
      },
      globeImage: {
        default: this.options.globeImage || null,
        onChange: (value) => {
          this.globeObj.material.map = value
          this.globeObj.material.needsUpdate = true
        },
      },
      normalImage: {
        default: this.options.normalImage || null,
        onChange: (value) => {
          this.globeObj.material.normalMap = value
          this.globeObj.material.needsUpdate = true
        },
      },
      bumpImage: {
        default: this.options.bumpImage || null,
        onChange: (value) => {
          this.globeObj.material.bumpMap = value
          this.globeObj.material.needsUpdate = true
        },
      },
      specularImage: {
        default: this.options.specularImage || null,
        onChange: (value) => {
          this.globeObj.material.specularMap = value
          this.globeObj.material.needsUpdate = true
        },
      },
      showAtmosphere: { default: this.options.showAtmosphere || false },
      atmosphereColor: { default: this.options.atmosphereColor || false },
      atmosphereAltitude: { default: this.options.atmosphereAltitude || 0.15 },
      atmosphereAltitude: { default: this.options.atmospherePower || 0.35 },
    }
    new ProxyData(props, this)
  }
  _init() {
    this.createGlobe()
  }
  _addEvent() {
    if (this.options.drag) {
      this.sphereMove()
    }
  }
  sphereMove() {
    window.addEventListener("mousedown", (event) => {
      this.mouse.down = true
      this.mouse.prevX = event.clientX
      this.mouse.prevY = event.clientY
    })
    window.addEventListener("mousemove", (event) => {
      if (this.mouse.down) {
        event.preventDefault()
        let deltaX = event.clientX - this.mouse.prevX
        let deltaY = event.clientY - this.mouse.prevY
        this.mouse.prevX = event.clientX
        this.mouse.prevY = event.clientY
        this.instance.rotation.offset.y += deltaX * 0.005
        gsap.to(this.instance.rotation, {
          x: this.instance.rotation.offset.x,
          y: this.instance.rotation.offset.y,
          duration: 1.5,
        })
      }
    })
    window.addEventListener("mouseup", () => {
      this.mouse.down = false
    })
  }
  createGlobe() {
    const { radius, globeImage, globeNightImage, normalImage, normalScale, specularImage, bumpImage, bumpScale } =
      this.options
    let geometry = new SphereGeometry(radius, 128, 128)
    let material = new MeshPhongMaterial({
      color: this.options.globeColor,
      map: globeImage,
      normalMap: normalImage,
      normalScale: normalScale,
      bumpMap: bumpImage,
      bumpScale: bumpScale,
      specularMap: specularImage,
      wireframe: false,
      shininess: 30,
      side: DoubleSide,
      specular: new Color("#ffffff"),
    })
    console.log(material)
    this.globeObj = new Mesh(geometry, material)
    this.instance.add(this.globeObj)
    if (globeNightImage) this.setDayNight(material)
  }
  setDayNight(material) {
    const { globeImage, globeNightImage, globeColor } = this.options
    globeImage.colorSpace = SRGBColorSpace
    globeNightImage.colorSpace = SRGBColorSpace
    material.onBeforeCompile = (shader) => {
      this.shader = shader
      shader.uniforms = {
        ...shader.uniforms,
        uColor: {
          value: new Color(globeColor),
        },
        sunDirection: {
          value: new Vector3(1, 1, 0),
        },
        dayTexture: {
          value: globeImage,
        },
        nightTexture: {
          value: globeNightImage,
        },
      }
      shader.vertexShader = shader.vertexShader.replace(
        "void main() {",
        `
        varying vec2 vUv;
        varying vec3 vNormall;
        void main() {
          vUv = uv;
          vNormall = normalMatrix * normal;
              `
      )
      shader.fragmentShader = shader.fragmentShader.replace(
        "void main() {",
        `
          uniform sampler2D dayTexture;
          uniform sampler2D nightTexture;
          uniform vec3 sunDirection;
          uniform vec3 uColor;
          varying vec2 vUv;
          varying vec3 vNormall;
          void main() {
        `
      )
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <opaque_fragment>",
        `
              #ifdef OPAQUE
              diffuseColor.a = 1.0;
              #endif
              #ifdef USE_TRANSMISSION
              diffuseColor.a *= material.transmissionAlpha;
              #endif
              vec3 dayColor = texture2D(dayTexture, vUv).rgb;
              vec3 nightColor = texture2D(nightTexture, vUv).rgb;
              float cosineAngleSunToNormal = dot(normalize(vNormall), sunDirection);
              cosineAngleSunToNormal = clamp(cosineAngleSunToNormal * 5.0, -1.0, 1.0);
              float mixAmount = cosineAngleSunToNormal * 0.5 + 0.5;
              vec3 color = mix(nightColor, dayColor, mixAmount);
              color *= mix(outgoingLight, uColor, 0.5);
              gl_FragColor = vec4(color , diffuseColor.a );
              `
      )
    }
  }
  createAtmosphere() {
    const { radius, atmosphereColor, atmosphereAltitude, atmospherePower } = this.options
    let atmosphere = createGlowMesh(this.globeObj.geometry, {
      backside: true,
      color: atmosphereColor,
      size: radius * atmosphereAltitude,
      power: atmospherePower,
      coefficient: 0.15,
    })
    this.atmosphere = atmosphere
    this.instance.add(atmosphere)
  }
  setParent(parent) {
    parent.add(this.instance)
  }
  add(obj) {
    this.instance.add(obj)
  }
}
