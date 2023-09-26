const ReferenceX = 95.047;
const ReferenceY = 100;
const ReferenceZ = 108.883;

const RGBToXYZ = (R, G, B) => {
  let var_R = R / 255;
  let var_G = G / 255;
  let var_B = B / 255;

  if (var_R > 0.04045) {
    var_R = Math.pow((var_R + 0.055) / 1.055, 2.4);
  } else {
    var_R = var_R / 12.92;
  }

  if (var_G > 0.04045) {
    var_G = Math.pow((var_G + 0.055) / 1.055, 2.4);
  } else {
    var_G = var_G / 12.92;
  }

  if (var_B > 0.04045) {
    var_B = Math.pow((var_B + 0.055) / 1.055, 2.4);
  } else {
    var_B = var_B / 12.92;
  }

  var_R = var_R * 100;
  var_G = var_G * 100;
  var_B = var_B * 100;

  const X = var_R * 0.4124 + var_G * 0.3576 + var_B * 0.1805;
  const Y = var_R * 0.2126 + var_G * 0.7152 + var_B * 0.0722;
  const Z = var_R * 0.0193 + var_G * 0.1192 + var_B * 0.9505;

  return [X, Y, Z];
};

const XYZToRGB = (X, Y, Z) => {
  const var_X = X / 100;
  const var_Y = Y / 100;
  const var_Z = Z / 100;

  let var_R = var_X * 3.2406 + var_Y * -1.5372 + var_Z * -0.4986;
  let var_G = var_X * -0.9689 + var_Y * 1.8758 + var_Z * 0.0415;
  let var_B = var_X * 0.0557 + var_Y * -0.204 + var_Z * 1.057;

  if (var_R > 0.0031308) {
    var_R = 1.055 * Math.pow(var_R, 1 / 2.4) - 0.055;
  } else {
    var_R = 12.92 * var_R;
  }

  if (var_G > 0.0031308) {
    var_G = 1.055 * Math.pow(var_G, 1 / 2.4) - 0.055;
  } else {
    var_G = 12.92 * var_G;
  }

  if (var_B > 0.0031308) {
    var_B = 1.055 * Math.pow(var_B, 1 / 2.4) - 0.055;
  } else {
    var_B = 12.92 * var_B;
  }

  const R = var_R * 255;
  const G = var_G * 255;
  const B = var_B * 255;

  return [R, G, B];
};

const XYZToLAB = (X, Y, Z) => {
  let var_X = X / ReferenceX;
  let var_Y = Y / ReferenceY;
  let var_Z = Z / ReferenceZ;

  if (var_X > 0.008856) {
    var_X = Math.pow(var_X, 1 / 3);
  } else {
    var_X = 7.787 * var_X + 16 / 116;
  }

  if (var_Y > 0.008856) {
    var_Y = Math.pow(var_Y, 1 / 3);
  } else {
    var_Y = 7.787 * var_Y + 16 / 116;
  }

  if (var_Z > 0.008856) {
    var_Z = Math.pow(var_Z, 1 / 3);
  } else {
    var_Z = 7.787 * var_Z + 16 / 116;
  }

  const L = 116 * var_Y - 16;
  const A = 500 * (var_X - var_Y);
  const B = 200 * (var_Y - var_Z);

  return [L, A, B];
};

const LABToXYZ = (L, A, B) => {
  let var_Y = (L + 16) / 116;
  let var_X = A / 500 + var_Y;
  let var_Z = var_Y - B / 200;

  let var_YP3 = Math.pow(var_Y, 3);
  let var_XP3 = Math.pow(var_X, 3);
  let var_ZP3 = Math.pow(var_Z, 3);

  if (var_YP3 > 0.008856) {
    var_Y = var_YP3;
  } else {
    var_Y = (var_Y - 16 / 116) / 7.787;
  }

  if (var_XP3 > 0.008856) {
    var_X = var_XP3;
  } else {
    var_X = (var_X - 16 / 116) / 7.787;
  }

  if (var_ZP3 > 0.008856) {
    var_Z = var_ZP3;
  } else {
    var_Z = (var_Z - 16 / 116) / 7.787;
  }

  const X = var_X * ReferenceX;
  const Y = var_Y * ReferenceY;
  const Z = var_Z * ReferenceZ;

  return [X, Y, Z];
};

const imageRGBAtoLAB = (srcArray) => {
  const resArray = [];

  let r, g, b;
  let x, y, z;
  let cL, cA, cB;

  let labI = 0;
  for (let i = 0; i < srcArray.length; i += 4) {
    r = srcArray[i + 0];
    g = srcArray[i + 1];
    b = srcArray[i + 2];

    [x, y, z] = RGBToXYZ(r, g, b);
    [cL, cA, cB] = XYZToLAB(x, y, z);

    resArray[labI + 0] = cL;
    resArray[labI + 1] = cA;
    resArray[labI + 2] = cB;

    labI += 3;
  }

  return resArray;
};

const imageLABtoRGBA = (srcArray, alpha = 255) => {
  const resArray = new Uint8ClampedArray((srcArray.length * 4) / 3);

  let cL, cA, cB;
  let x, y, z;
  let r, g, b;

  let rgbI = 0;
  for (let i = 0; i < srcArray.length; i += 3) {
    cL = srcArray[i + 0];
    cA = srcArray[i + 1];
    cB = srcArray[i + 2];

    [x, y, z] = LABToXYZ(cL, cA, cB);
    [r, g, b] = XYZToRGB(x, y, z);

    resArray[rgbI + 0] = r;
    resArray[rgbI + 1] = g;
    resArray[rgbI + 2] = b;
    resArray[rgbI + 3] = alpha;

    rgbI += 4;
  }

  return resArray;
};

export { imageRGBAtoLAB, imageLABtoRGBA };
