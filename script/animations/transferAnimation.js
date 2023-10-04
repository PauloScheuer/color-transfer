import { LABToRGB, RGBToHex } from "../colorspaces.js";
import { randomBetween } from "../utils.js";

export const startTransferAnimation = (arrSamples, callBack) => {
  const canvas = document.getElementById("canvasTransfer");

  animate(canvas, arrSamples, [], callBack, true);
};

const N_COLOR_ITEMS_COUNT = 5;

const animate = (canvas, arrSamples, arrItems, callBack, bCanDispatch) => {
  requestAnimationFrame(() => {
    if (shouldTriggerColorize(arrItems, canvas, bCanDispatch)) {
      bCanDispatch = false;
      window.dispatchEvent(new CustomEvent("colorize"));
    }

    if (shouldCutItems(arrItems, canvas)) {
      arrItems.splice(0, 100);
    }

    const context = canvas.getContext("2d");

    context.clearRect(0, 0, canvas.width, canvas.height);

    const bShouldStop = shouldStop();
    if (bShouldStop) {
      if (shouldFinishAnimation(arrItems, canvas)) {
        window.removeEventListener("colorize", callBack);
        return;
      }
    } else {
      for (let i = 0; i < N_COLOR_ITEMS_COUNT; i++) {
        const indexColor = randomBetween(0, arrSamples.length - 1);
        const labColor = arrSamples[indexColor];
        const rgbColor = LABToRGB(labColor.L, labColor.a, labColor.b);
        const hexColor = RGBToHex(rgbColor[0], rgbColor[1], rgbColor[2]);

        const { x, y } = determinePosition(canvas);

        arrItems.push({ x, y, color: hexColor });
      }
    }

    arrItems.forEach((item) => {
      context.fillStyle = item.color;

      moveItem(item, bShouldStop);

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

const shouldFinishAnimation = (arrItems, canvas) => {
  if (document.documentElement.scrollWidth > 840) {
    return arrItems[arrItems.length - 1].x >= canvas.width;
  }

  return arrItems[arrItems.length - 1].y >= canvas.height;
};

const shouldTriggerColorize = (arrItems, canvas, bCanDispatch) => {
  if (document.documentElement.scrollWidth > 840) {
    return arrItems.length > canvas.width * N_COLOR_ITEMS_COUNT && bCanDispatch;
  }

  return arrItems.length > canvas.height * N_COLOR_ITEMS_COUNT && bCanDispatch;
};

const shouldCutItems = (arrItems, canvas) => {
  if (document.documentElement.scrollWidth > 840) {
    return arrItems.length > canvas.width * 2 * N_COLOR_ITEMS_COUNT;
  }

  return arrItems.length > canvas.height * 2 * N_COLOR_ITEMS_COUNT;
};

const determinePosition = (canvas) => {
  if (document.documentElement.scrollWidth > 840) {
    return {
      x: 0,
      y: randomBetween(130, canvas.height - 130),
    };
  }

  return {
    x: randomBetween(20, canvas.width - 20),
    y: 0,
  };
};

const moveItem = (item, bShouldStop) => {
  if (document.documentElement.scrollWidth > 840) {
    item.y = disturb(item.y);
    item.x = item.x + 1;
    if (bShouldStop) {
      item.x *= 1.02;
    }

    return;
  }

  item.x = disturb(item.x);
  item.y = item.y + 1;
  if (bShouldStop) {
    item.y *= 1.02;
  }
};
