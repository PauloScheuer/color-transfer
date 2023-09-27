import { LABToRGB, RGBToHex } from "./colorspaces.js";

export const startTransferAnimation = (arrSamples) => {
  const canvas = document.getElementById("canvasTransfer");

  animate(canvas, arrSamples, 0);
};

const animate = (canvas, arrSamples, curPos) => {
  requestAnimationFrame(() => {
    const context = canvas.getContext("2d");

    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.lineWidth = 40;
    let lastX = 0;

    const arrSamplesCopy = [...arrSamples];
    const arrLastNSamples = arrSamplesCopy.splice(-curPos, curPos);
    const arrSamplesMoved = [...arrLastNSamples, ...arrSamplesCopy];

    arrSamplesMoved.forEach((labColor) => {
      const rgbColor = LABToRGB(labColor.L, labColor.a, labColor.b);
      const curX = lastX + canvas.width / arrSamples.length;

      context.strokeStyle = RGBToHex(rgbColor[0], rgbColor[1], rgbColor[2]);
      context.beginPath();
      context.moveTo(lastX, 20);
      context.lineTo(curX, 20);
      context.stroke();

      lastX = curX;
    });
    animate(
      canvas,
      arrSamples,
      curPos < arrSamples.length - 1 ? curPos + 1 : 0
    );
  });
};
