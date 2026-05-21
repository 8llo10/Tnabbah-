import { Buffer } from "buffer";
import { Platform } from "react-native";
import { BleManager, Characteristic, Device, State } from "react-native-ble-plx";

let bleManager: BleManager | null = null;
let bleManagerInitError: Error | null = null;

function getBleManager(): BleManager {
  if (bleManagerInitError) {
    throw bleManagerInitError;
  }
  if (bleManager) {
    return bleManager;
  }
  if (Platform.OS === "web") {
    bleManagerInitError = new Error(
      "البلوتوث غير مدعوم على نسخة الويب. استخدم تطبيق أندرويد أو iOS."
    );
    throw bleManagerInitError;
  }
  try {
    bleManager = new BleManager();
    return bleManager;
  } catch (error) {
    console.error("BleManager initialization failed:", error);
    bleManagerInitError = new Error(
      "تعذّر تهيئة البلوتوث. تحتاج نسخة تطبيق مبنية محلياً (Development Build) تتضمن react-native-ble-plx؛ Expo Go لا يدعم هذه المكتبة."
    );
    throw bleManagerInitError;
  }
}

let connectedDevice: Device | null = null;
let writeChar: Characteristic | null = null;
let notifyChar: Characteristic | null = null;

let rxBuffer = "";
let lastInitResponse = "";
let monitorSubscription: { remove: () => void } | null = null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const toBase64 = (text: string) => Buffer.from(text, "utf8").toString("base64");

const fromBase64 = (text?: string | null) =>
  text ? Buffer.from(text, "base64").toString("utf8") : "";

function cleanResponse(text: string) {
  return text.replace(/\r/g, "\n").replace(/\n\n+/g, "\n").trim();
}

function looksLikeElmResponse(text: string) {
  const value = text.toUpperCase();

  return (
    value.includes("ELM") ||
    value.includes("OBD") ||
    value.includes("OK") ||
    value.includes(">") ||
    value.includes("SEARCHING") ||
    value.includes("NO DATA") ||
    value.includes("41 ") ||
    value.includes("410")
  );
}

function charScore(char: Characteristic) {
  const uuid = char.uuid.toLowerCase();
  let score = 0;

  if (uuid.includes("ffe1")) score += 50;
  if (uuid.includes("ffe2")) score += 45;
  if (uuid.includes("fff1")) score += 40;
  if (uuid.includes("fff2")) score += 35;
  if (uuid.includes("fff3")) score += 30;
  if (uuid.includes("2af0")) score += 60;
  if (uuid.includes("2af1")) score += 60;
  if (uuid.includes("2af2")) score += 60;
  if (uuid.includes("0000fff")) score += 20;
  if (uuid.includes("0000ffe")) score += 20;

  if (char.isWritableWithoutResponse) score += 8;
  if (char.isWritableWithResponse) score += 5;
  if (char.isNotifiable) score += 8;
  if (char.isIndicatable) score += 5;

  return score;
}

async function writeToChar(char: Characteristic, command: string) {
  const fullCommand = command.endsWith("\r") ? command : `${command}\r`;
  const data = toBase64(fullCommand);

  if (char.isWritableWithoutResponse) {
    await char.writeWithoutResponse(data);
    return;
  }

  if (char.isWritableWithResponse) {
    await char.writeWithResponse(data);
    return;
  }

  throw new Error("هذه القناة لا تدعم الكتابة.");
}

export const elmBluetoothService = {
  get manager(): BleManager {
    return getBleManager();
  },

  async waitForBluetoothReady() {
    const state = await getBleManager().state();

    if (state !== State.PoweredOn) {
      throw new Error("البلوتوث غير جاهز. فعّليه ثم أعيدي المحاولة.");
    }
  },

  async connect(deviceId: string) {
    await this.waitForBluetoothReady();

    getBleManager().stopDeviceScan();

    const device = await getBleManager().connectToDevice(deviceId, {
      timeout: 20000,
      autoConnect: true,
    });

    connectedDevice = await device.discoverAllServicesAndCharacteristics();

    writeChar = null;
    notifyChar = null;
    rxBuffer = "";
    lastInitResponse = "";

    if (monitorSubscription) {
      monitorSubscription.remove();
      monitorSubscription = null;
    }

    await this.findWorkingCharacteristics();
    await this.initElm();

    return connectedDevice;
  },

  async getAllCharacteristics() {
    if (!connectedDevice) {
      throw new Error("لا يوجد جهاز متصل.");
    }

    const all: Characteristic[] = [];
    const services = await connectedDevice.services();

    for (const service of services) {
      const chars = await service.characteristics();

      console.log("BLE SERVICE:", service.uuid);

      for (const char of chars) {
        console.log("BLE CHAR:", {
          serviceUUID: char.serviceUUID,
          uuid: char.uuid,
          write: char.isWritableWithResponse,
          writeNoRes: char.isWritableWithoutResponse,
          notify: char.isNotifiable,
          indicate: char.isIndicatable,
          score: charScore(char),
        });

        all.push(char);
      }
    }

    return all;
  },

  async startListeningWithChar(char: Characteristic) {
    if (monitorSubscription) {
      monitorSubscription.remove();
      monitorSubscription = null;
    }

    rxBuffer = "";

    monitorSubscription = char.monitor((error, characteristic) => {
      if (error) {
        console.log("ELM monitor error:", error);
        return;
      }

      const chunk = fromBase64(characteristic?.value);

      if (chunk) {
        console.log("ELM RX:", chunk);
        rxBuffer += chunk;
      }
    });

    await sleep(250);
  },

  async tryPair(writeCandidate: Characteristic, notifyCandidate: Characteristic) {
    rxBuffer = "";

    await this.startListeningWithChar(notifyCandidate);

    await writeToChar(writeCandidate, "ATI");
    await sleep(1700);

    const response = cleanResponse(rxBuffer);

    console.log("TRY BLE PAIR:", {
      write: writeCandidate.uuid,
      notify: notifyCandidate.uuid,
      response,
    });

    return response;
  },

  async findWorkingCharacteristics() {
    const allChars = await this.getAllCharacteristics();

    const writable = allChars
      .filter((c) => c.isWritableWithResponse || c.isWritableWithoutResponse)
      .sort((a, b) => charScore(b) - charScore(a));

    const notifiable = allChars
      .filter((c) => c.isNotifiable || c.isIndicatable)
      .sort((a, b) => charScore(b) - charScore(a));

    if (writable.length === 0) {
      throw new Error("ما لقينا قناة إرسال مناسبة للقطعة.");
    }

    if (notifiable.length === 0) {
      throw new Error("ما لقينا قناة قراءة Notify مناسبة للقطعة.");
    }

    console.log(
      "WRITABLE CANDIDATES:",
      writable.map((c) => c.uuid)
    );

    console.log(
      "NOTIFY CANDIDATES:",
      notifiable.map((c) => c.uuid)
    );

    // أولًا جرّب نفس السيرفس لأن أغلب UART تكون write/notify بنفس الخدمة
    const sameServicePairs: Array<{
      write: Characteristic;
      notify: Characteristic;
    }> = [];

    for (const w of writable) {
      for (const n of notifiable) {
        if (w.serviceUUID === n.serviceUUID) {
          sameServicePairs.push({ write: w, notify: n });
        }
      }
    }

    const otherPairs: Array<{
      write: Characteristic;
      notify: Characteristic;
    }> = [];

    for (const w of writable) {
      for (const n of notifiable) {
        if (w.serviceUUID !== n.serviceUUID) {
          otherPairs.push({ write: w, notify: n });
        }
      }
    }

    const pairs = [...sameServicePairs, ...otherPairs];

    let bestWrite = writable[0];
    let bestNotify = notifiable[0];
    let bestResponse = "";

    for (const pair of pairs) {
      try {
        const response = await this.tryPair(pair.write, pair.notify);

        if (response) {
          bestWrite = pair.write;
          bestNotify = pair.notify;
          bestResponse = response;

          if (looksLikeElmResponse(response)) {
            break;
          }
        }
      } catch (error) {
        console.log("PAIR TEST FAILED:", {
          write: pair.write.uuid,
          notify: pair.notify.uuid,
          error,
        });
      }
    }

    writeChar = bestWrite;
    notifyChar = bestNotify;

    await this.startListeningWithChar(notifyChar);

    console.log("FINAL WRITE CHAR:", writeChar.uuid);
    console.log("FINAL NOTIFY CHAR:", notifyChar.uuid);
    console.log("FINAL TEST RESPONSE:", bestResponse || "EMPTY");

    if (!bestResponse) {
      lastInitResponse =
        "تم الاتصال بالقطعة، لكن كل قنوات BLE رجعت EMPTY RESPONSE عند اختبار ATI.";
    }
  },

  async write(command: string) {
    if (!writeChar) {
      throw new Error("قناة الإرسال غير جاهزة.");
    }

    await writeToChar(writeChar, command);
  },

  async send(command: string, waitMs = 1200) {
    rxBuffer = "";

    await this.write(command);
    await sleep(waitMs);

    return cleanResponse(rxBuffer);
  },

  async initElm() {
    const responses: string[] = [];

    responses.push(`ATI:\n${await this.send("ATI", 1800)}`);
    responses.push(`ATZ:\n${await this.send("ATZ", 2200)}`);
    responses.push(`ATE0:\n${await this.send("ATE0", 900)}`);
    responses.push(`ATL0:\n${await this.send("ATL0", 900)}`);
    responses.push(`ATS0:\n${await this.send("ATS0", 900)}`);
    responses.push(`ATH0:\n${await this.send("ATH0", 900)}`);
    responses.push(`ATAT1:\n${await this.send("ATAT1", 900)}`);
    responses.push(`ATSP0:\n${await this.send("ATSP0", 1800)}`);
    responses.push(`0100:\n${await this.send("0100", 3000)}`);

    lastInitResponse = responses.filter(Boolean).join("\n---\n");

    console.log("ELM INIT RESPONSE:", lastInitResponse);

    return lastInitResponse;
  },

  async sendRaw(command: string, waitMs = 1200) {
    return this.send(command, waitMs);
  },

  async testObd() {
    const commands = ["ATI", "ATDP", "0100", "010C", "010D", "0142"];
    const result: Record<string, string> = {};

    for (const command of commands) {
      result[command] = await this.send(
        command,
        command.startsWith("01") ? 3000 : 1800
      );

      await sleep(200);
    }

    return result;
  },

  async disconnect() {
    try {
      if (monitorSubscription) {
        monitorSubscription.remove();
        monitorSubscription = null;
      }

      if (connectedDevice) {
        await getBleManager().cancelDeviceConnection(connectedDevice.id);
      }
    } catch (error) {
      console.log("ELM disconnect error:", error);
    }

    connectedDevice = null;
    writeChar = null;
    notifyChar = null;
    rxBuffer = "";
    lastInitResponse = "";
  },

  getConnectedDevice() {
    return connectedDevice;
  },

  isConnected() {
    return !!connectedDevice;
  },

  getLastInitResponse() {
    return lastInitResponse;
  },
};