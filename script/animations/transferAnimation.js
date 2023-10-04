import { LABToRGB, RGBToHex } from "../colorspaces.js";
import { randomBetween } from "../utils.js";

export const startTransferAnimation = (arrSamples, callBack) => {
  const canvas = document.getElementById("canvasTransfer");

  animate(canvas, arrSamples, [], callBack, true);
};

const N_COLOR_ITEMS_COUNT = 5;

const animate = (canvas, arrSamples, arrItems, callBack, bCanDispatch) => {
  requestAnimationFrame(() => {
    if (arrItems.length > canvas.width * N_COLOR_ITEMS_COUNT && bCanDispatch) {
      bCanDispatch = false;
      window.dispatchEvent(new CustomEvent("colorize"));
    }

    if (arrItems.length > canvas.width * 2 * N_COLOR_ITEMS_COUNT) {
      arrItems.splice(0, 100);
    }

    const context = canvas.getContext("2d");

    context.clearRect(0, 0, canvas.width, canvas.height);

    const bShouldStop = shouldStop();
    if (bShouldStop) {
      arrItems.splice(0, 5);
      window.removeEventListener("colorize", callBack);

      if (arrItems.length === 0) {
        return;
      }
    } else {
      for (let i = 0; i < N_COLOR_ITEMS_COUNT; i++) {
        const indexColor = randomBetween(0, arrSamples.length - 1);
        const labColor = arrSamples[indexColor];
        const rgbColor = LABToRGB(labColor.L, labColor.a, labColor.b);
        const hexColor = RGBToHex(rgbColor[0], rgbColor[1], rgbColor[2]);

        const posY = randomBetween(130, canvas.height - 130);

        arrItems.push({ x: 0, y: posY, color: hexColor });
      }
    }

    arrItems.forEach((item) => {
      context.fillStyle = item.color;
      item.y = disturb(item.y);
      item.x = item.x + 1;
      if (bShouldStop) {
        item.x *= 1.02;
      }

      context.beginPath();
      context.arc(item.x, item.y, 2, 0, 2 * Math.PI);
      context.fill();
    });

    animate(canvas, arrSamples, arrItems, callBack, bCanDispatch);
  });
};

const disturb = (num) => {
  const mult = Math.random() > 0.5 ? -1 : 1;
  return num + Math.random() * mult;
};

const shouldStop = () => {
  const result = document.getElementById("result");
  return !!result.src;
};
