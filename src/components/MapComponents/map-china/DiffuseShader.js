import { Color } from "three"
export class DiffuseShader {
  constructor({ material, time, size, diffuseColor, diffuseSpeed, diffuseWidth, diffuseDir }) {
    this.time = time
    let defaultOptions = {
      size: 100,
      diffuseSpeed: 15.0,
      diffuseColor: 0x8e9b9e,
      diffuseWidth: 10.0,
      diffuseDir: 1.0,
    }
    this.options = Object.assign({}, defaultOptions, {
      material,
      size,
      diffuseColor,
      diffuseSpeed,
      diffuseWidth,
      diffuseDir,
    })
    this.init()
  }
  init() {
    let pointShader = null
    let { material, size, diffuseColor, diffuseSpeed, diffuseWidth, diffuseDir } = this.options
    let maxTime = size / diffuseSpeed
    material.onBeforeCompile = (shader) => {
      pointShader = shader
      shader.uniforms = {
        ...shader.uniforms,
        uTime: {
          value: 0.0,
        },
        uSpeed: {
          value: diffuseSpeed,
        },
        uWidth: {
          value: diffuseWidth,
        },
        uColor: {
          value: new Color(diffuseColor),
        },
        uDir: {
          value: diffuseDir,
        },
      }
      shader.vertexShader = shader.vertexShader.replace(
        "void main() {",
        `
            varying vec3 vPosition;
            void main(){
              vPosition = position;
          `
      )
      shader.fragmentShader = shader.fragmentShader.replace(
        "void main() {",
        `
            uniform float uTime;
            uniform float uSpeed;
            uniform float uWidth;
            uniform vec3 uColor;
            uniform float uDir;
            varying vec3 vPosition;
            void main(){
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
            float r = uTime * uSpeed;
            //光环宽度
            float w = 0.0; 
            if(w>uWidth){
              w = uWidth;
            }else{
              w = uTime * 5.0;
            }
            //几何中心点
            vec2 center = vec2(0.0, 0.0);
            float rDistance = distance(vPosition.xz, center);
            if(uDir==2.0){
              rDistance = distance(vPosition.xy, center);
            }
            if(rDistance > r && rDistance < r + 2.0 * w) {
              float per = 0.0;
              if(rDistance < r + w) {
                per = (rDistance - r) / w;
                outgoingLight = mix(outgoingLight, uColor, per);
                float alphaV = mix(0.0,diffuseColor.a,per);
                gl_FragColor = vec4(outgoingLight,  alphaV);
              } else {
                per = (rDistance - r - w) / w;
                outgoingLight = mix(uColor, outgoingLight, per);
                float alphaV = mix(diffuseColor.a,0.0,per);
                gl_FragColor = vec4(outgoingLight,  alphaV);
              }
            } else {
              gl_FragColor = vec4(outgoingLight, 0.0);
            }
          `
      )
    }
    this.time.on("tick", (deltaTime) => {
      if (pointShader) {
        pointShader.uniforms.uTime.value += deltaTime
        if (pointShader.uniforms.uTime.value > maxTime) {
          pointShader.uniforms.uTime.value = 0
        }
      }
    })
  }
}
