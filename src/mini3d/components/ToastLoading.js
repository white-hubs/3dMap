export class ToastLoading {
  constructor() {
    this.toastNode = null;
    this.init();
  }
  init() {
    if (this.toastNode) {
      return false;
    }
    this.toastNode = document.createElement("div");
    this.toastNode.classList.add("fixed-loading");
    this.toastNode.id = "fixed-loading";
    this.toastNode.innerHTML = `
    <div class="page-loading-container">
      <div class="page-loading"></div>
    </div>
  `;

    this.toastNode.style.visibility = "hidden";
    document.body.appendChild(this.toastNode);
  }
  show() {
    this.toastNode.style.visibility = "visible";
  }
  hide() {
    if (this.toastNode) {
      this.toastNode.style.visibility = "hidden";
    }
  }
  destroy() {
    if (this.toastNode) {
      document.body.removeChild(this.toastNode);
    }
  }
}
