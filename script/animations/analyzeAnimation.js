const N_INC = 4;

export const startAnalyzeAnimation = (id) => {
  const result = document.getElementById("result");
  result.removeAttribute("src");
  result.classList.add("invisible");

  const canvas = document.getElementById("canvasAnalyze");
  canvas.classList.remove("invisible");

  const context = canvas.getContext("2d");

  const imgElement = document.getElementById(id);
  const imgRect = imgElement.getBoundingClientRect();

  canvas.width = imgRect.width;
  canvas.height = imgRect.height;

  animate(0, canvas, context, true);
};

const animate = (curY, canvas, context, bInc) => {
  requestAnimationFrame(() => {
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.beginPath();
    context.lineWidth = 2;
    context.strokeStyle = "red";
    context.moveTo(0, curY);
    context.lineTo(canvas.width, curY);
    context.stroke();

    if (bInc) {
      if (curY < canvas.height) {
        animate(curY + N_INC, canvas, context, bInc);
      } else if (!shouldEndAnimation()) {
        animate(canvas.height, canvas, context, false);
      } else {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    } else {
      if (curY > 0) {
        animate(curY - N_INC, canvas, context, bInc);
      } else if (!shouldEndAnimation()) {
        animate(0, canvas, context, true);
      } else {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  });
};

const shouldEndAnimation = () => {
  const result = document.getElementById("result");
  return !!result.src;
};
