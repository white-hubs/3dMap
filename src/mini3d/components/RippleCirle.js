import { AdditiveBlending, Group, Line, LineBasicMaterial } from "three"
import { CircleLineGeometry } from "../utils/index"
export class RippleCirle {
  constructor({ time }, options = {}) {
    this.time = time
    this.instance = new Group()
    this.circles = []
    this.options = Object.assign(
      {},
      {
        isPaused: false,
        number: 10,
        radius: 10,
        frequency: 5,
        color: 0xffffff,
      },
      options
    )
    this.init()
    this.update()
  }
  init() {
    let { number, radius, frequency, color } = this.options
    for (let i = 0; i < number; i++) {
      let circle = new Line(
        new CircleLineGeometry(radius),
        new LineBasicMaterial({
          color: color,
          transparent: true,
          depthTest: true,
          depthWrite: false,
          blending: AdditiveBlending,
        })
      )
      circle.name = "CircleLine"
      circle.scale.set(0, 0, 0)
      circle._s = (i + 1) / frequency
      this.circles.push(circle)
      this.instance.add(circle)
    }
  }
  update() {
    this.time.on("tick", () => {
      if (this.circles.length && !this.options.isPaused) {
        this.circles.forEach((circle) => {
          circle._s += 0.005
          circle.scale.set(circle._s, circle._s, circle._s)
          circle.material.opacity = 1
          if (circle._s >= 1) {
            circle.material.opacity = 1 - (circle._s - 1)
          }
          if (circle._s >= 2) {
            circle._s = 0
          }
        })
      }
    })
  }
  setParent(parent) {
    parent.add(this.instance)
  }
  setPosition(position) {
    this.instance.position.copy(position)
  }
  destroy() {
    this.options.isPaused = true
  }
}
