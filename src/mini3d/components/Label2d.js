import { CSS2DObject, CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer"
import { Component } from "../components"
export class Label2d extends Component {
  constructor(base) {
    super(base)
    let { width, height, container } = base
    let css2dRender = new CSS2DRenderer()
    css2dRender.setSize(width, height)
    css2dRender.domElement.style.position = "absolute"
    css2dRender.domElement.style.left = "0px"
    css2dRender.domElement.style.top = "0px"
    css2dRender.domElement.style.pointerEvents = "none"
    container.appendChild(css2dRender.domElement)
    this.css2dRender = css2dRender
    this.base.animator.add(() => this.update())
    this.base.resizer.add(() => this.resize())
  }
  create(name = "", className = "") {
    let tag = document.createElement("div")
    tag.innerHTML = name
    tag.className = className
    tag.style.pointerEvents = "none"
    tag.style.visibility = "hidden"
    tag.style.position = "absolute"
    if (!className) {
      tag.style.padding = "10px"
      tag.style.color = "#fff"
      tag.style.fontSize = "12px"
      tag.style.textAlign = "center"
      tag.style.background = "rgba(0,0,0,0.6)"
      tag.style.borderRadius = "4px"
    }
    let label = new CSS2DObject(tag)
    label.show = (name, point) => {
      label.element.innerHTML = name
      label.element.style.visibility = "visible"
      label.position.copy(point)
    }
    label.hide = () => {
      label.element.style.visibility = "hidden"
    }
    return label
  }
  update() {
    if (this.css2dRender) {
      let { scene, camera } = this.base
      this.css2dRender.render(scene, camera)
    }
  }
  resize() {
    if (this.css2dRender) {
      let { width, height } = this.base
      this.css2dRender.setSize(width, height)
    }
  }
  dispose() {
    if (this.css2dRender) {
      this.base.container.removeChild(this.css2dRender.domElement)
      this.css2dRender = null
    }
  }
}
