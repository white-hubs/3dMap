import { Color } from "three"
export class DiffuseShader {
  constructor({ material, time, size, diffuseColor, diffuseSpeed, diffuseHeight, diffuseStart }) {
    this.time = time
    let defaultOptions = {
      size: 100,
      diffuseSpeed: 15.0,
      diffuseColor: 0x8e9b9e,
      diffuseHeight: 10.0,
      diffuseStart: 1.0,
    }
    this.options = Object.assign({}, defaultOptions, {
      material,
      size,
      diffuseColor,
      diffuseSpeed,
      diffuseHeight,
      diffuseStart,
    })
    this.init()
  }
  init() {
    let pointShader = null
    let { material, size, diffuseColor, diffuseSpeed, diffuseHeight, diffuseStart } = this.options
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
        uHeight: {
          value: diffuseHeight,
        },
        uStart: { value: diffuseStart },
        uColor: {
          value: new Color(diffuseColor),
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
            uniform vec3 uColor;
            uniform float uSpeed;
            uniform float uHeight;
            uniform float uStart;
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
            float y0 = uStart + uTime * uSpeed * -1.0;
            float h = uHeight / 10.0;
            if(vPosition.y > y0 && vPosition.y < y0 + h*2.0){
              float per = 0.0;
              if(vPosition.y < y0 + h){
                  per = (vPosition.y - y0)*1.0 / h;
                  outgoingLight *= mix(outgoingLight,uColor,per);
                  diffuseColor.a =per;
                  diffuseColor.a =0.0;
              }else{
                  per = (vPosition.y - y0 - h)*1.0 / h;
                  outgoingLight *= mix(uColor,outgoingLight,per);
                  diffuseColor.a = 1.0-per;
              }
          }else{
          }
          gl_FragColor = vec4( outgoingLight, diffuseColor.a );
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
