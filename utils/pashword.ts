import * as bigintConversion from "bigint-conversion";
import scrypt from "scrypt-js";
import jsSHA from "jssha";

const N = 1 << 15;
const r = 8;
const p = 1;

const allowedCharacters =
  "@#$%&*._!0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const alphabets = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const uppercaseLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const lowercaseLetters = "abcdefghijklmnopqrstuvwxyz";
const numbers = "1234567890";
const validSymbols = "@#$%&*._!";

function replaceAt(str: string, index: number, chr: string) {
  if (index > str.length - 1) return str;
  return str.substring(0, index) + chr + str.substring(index + 1);
}

const encodeUtf8 = (str: string): Uint8Array => {
  return new TextEncoder().encode(str);
};

const sanitize = (
  pashword: string,
  noSymbols?: boolean,
  noNumbers?: boolean,
  length?: number
): string => {
  const prngObj = new jsSHA("SHAKE256", "TEXT", { encoding: "UTF8" });
  let pashwordArray = pashword.split("");

  const generateIndex = (hashThis: string): number => {
    prngObj.update(hashThis);
    let prng = prngObj.getHash("UINT8ARRAY", { outputLen: 256 });
    let result = bigintConversion.bufToBigint(prng);
    return Number(result % BigInt(alphabets.length));
  };

  if (noSymbols) {
    for (let i = 0; i < pashwordArray.length; i++) {
      // If symbol
      if (validSymbols.includes(pashwordArray[i])) {
        // Generate a random index using the symbol index
        // Replace the symbol with alphabet at the generated index
        pashwordArray[i] =
          alphabets[generateIndex(i.toString() + pashwordArray[i])];
      }
    }
  }

  if (noNumbers) {
    for (let i = 0; i < pashwordArray.length; i++) {
      // If symbol
      if (parseInt(pashwordArray[i]) >= 0 && parseInt(pashwordArray[i]) <= 9) {
        // Generate a random index using the symbol index
        // Replace the symbol with alphabet at the generated index
        pashwordArray[i] =
          alphabets[generateIndex(i.toString() + pashwordArray[i].toString())];
      }
    }
  }

  return pashwordArray.join("");
};

export const generatePashword = (
  toHash: string,
  pashwordLength: number,
  website: string,
  username: string
): string => {
  // SHAKE256 INITIALIZE
  const shaObj = new jsSHA("SHAKE256", "UINT8ARRAY");
  // SHA-3-512 INITIALIZE
  const sha3Obj = new jsSHA("SHA3-512", "TEXT", { encoding: "UTF8" });
  sha3Obj.update(toHash);
  // Convert toHash json object to its own SHA3-512 HEX
  toHash = sha3Obj.getHash("HEX");

  // GENERATE SCRYPT
  const scryptHash = scrypt.syncScrypt(
    encodeUtf8(toHash),
    encodeUtf8(website + username),
    N,
    r,
    p,
    32
  );

  const generateIndex = (modulo: number) => {
    shaObj.update(scryptHash);
    let prng = shaObj.getHash("UINT8ARRAY", { outputLen: 256 });
    // -- METHOD 1 --
    let result = bigintConversion.bufToBigint(prng);

    // -- METHOD 2 --
    // let view = new DataView(prng.buffer, 0);
    // let result = view.getBigUint64(0, true);

    // -- METHOD 3 --
    // let result = BigInt(0);
    // OR i < 8 to make result 64 bit
    // for (let i = 0; i < prng.length; i++) {
    //   result = result * BigInt(256) + BigInt(prng[i]);
    // }

    // SLICE TO READ ONLY 8 BYTES
    // prng = prng.slice(8, prng.length);

    return Number(result % BigInt(modulo));
  };

  const pickCharacter = (characterSet: string) => {
    return characterSet[generateIndex(characterSet.length)];
  };

  // TODO: Generate pickIndex according to Pashword Length
  let pickIndex = [
    13, 18, 11, 0, 14, 7, 5, 10, 17, 15, 4, 8, 19, 6, 1, 16, 2, 9, 3, 12,
  ];

  let removeIndex = generateIndex(pickIndex.length);
  let index1 = pickIndex[removeIndex];
  pickIndex.splice(removeIndex, 1);
  console.log("🚀 => index1", index1);

  removeIndex = generateIndex(pickIndex.length);
  let index2 = pickIndex[removeIndex];
  pickIndex.splice(removeIndex, 1);
  console.log("🚀 => index2", index2);

  removeIndex = generateIndex(pickIndex.length);
  let index3 = pickIndex[removeIndex];
  pickIndex.splice(removeIndex, 1);
  console.log("🚀 => index3", index3);

  removeIndex = generateIndex(pickIndex.length);
  let index4 = pickIndex[removeIndex];
  pickIndex.splice(removeIndex, 1);
  console.log("🚀 => index4", index4);

  let pashword = "";
  for (let i = 0; i < pashwordLength; i++) {
    if (i === index1) {
      pashword += pickCharacter(lowercaseLetters);
    } else if (i === index2) {
      pashword += pickCharacter(uppercaseLetters);
    } else if (i === index3) {
      pashword += pickCharacter(validSymbols);
    } else if (i === index4) {
      pashword += pickCharacter(numbers);
    } else {
      pashword += pickCharacter(allowedCharacters);
    }
  }

  return pashword;
};

export { sanitize, replaceAt };
