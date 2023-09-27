export const startAnalyzeAnimation = (id) => {
  const result = document.getElementById("result");
  result.removeAttribute("src");

  const canvas = document.getElementById("canvasAnalyze");
  canvas.classList.remove("invisible");

  const context = canvas.getContext("2d");

  const imgElement = document.getElementById(id);
  const imgRect = imgElement.getBoundingClientRect();

  canvas.width = imgRect.width;
  canvas.height = imgRect.height;

  animate(0, canvas, context);
};

const animate = (curY, canvas, context) => {
  requestAnimationFrame(() => {
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.beginPath();
    context.lineWidth = 2;
    context.strokeStyle = "red";
    context.moveTo(0, curY);
    context.lineTo(canvas.width, curY);
    context.stroke();

    if (curY < canvas.height) {
      animate(curY + 4, canvas, context);
    } else if (!shouldEndAnimation()) {
      animate(0, canvas, context);
    }
  });
};

const shouldEndAnimation = () => {
  const result = document.getElementById("result");
  return result.src !== "";
};
