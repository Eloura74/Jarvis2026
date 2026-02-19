import time
import serial
import serial.tools.list_ports

BAUD = 115200

def find_port(hint="USB"):
    ports = list(serial.tools.list_ports.comports())
    if not ports:
        raise RuntimeError("Aucun port COM détecté. Branche l'ESP32-S3 en USB.")

    # Essaie d'abord un port qui contient 'USB' / 'CP210' / 'CH340' / 'Espressif'
    preferred = []
    for p in ports:
        desc = (p.description or "").lower()
        manu = (p.manufacturer or "").lower()
        if any(k in desc for k in ["usb", "cp210", "ch340", "espressif", "serial"]) or "espressif" in manu:
            preferred.append(p.device)

    # Sinon prend le 1er
    return preferred[0] if preferred else ports[0].device

class JarvisSphere:
    def __init__(self, port=None, baud=BAUD, timeout=1.0):
        self.port = port or find_port()
        self.ser = serial.Serial(self.port, baudrate=baud, timeout=timeout)
        time.sleep(1.0)  # laisse le temps au reset USB/boot
        self.flush()

    def flush(self):
        self.ser.reset_input_buffer()
        self.ser.reset_output_buffer()

    def send(self, line: str):
        if not line.endswith("\n"):
            line += "\n"
        self.ser.write(line.encode("utf-8", errors="ignore"))

    def state(self, s: str):
        self.send(f"STATE {s}")

    def text(self, t: str):
        # évite les retours et limite à ~63 chars comme firmware
        t = t.replace("\r", " ").replace("\n", " ").strip()
        self.send(f"TEXT {t}")

    def ping(self):
        self.send("PING")

    def close(self):
        self.ser.close()

if __name__ == "__main__":
    orb = JarvisSphere(port="COM3")  # <- change si besoin (sinon laisse None)
    print("Connecté sur", orb.port)

    orb.text("Jarvis Sphere")
    orb.state("IDLE")
    time.sleep(1)

    orb.state("LISTENING")
    orb.text("Je t'ecoute...")
    time.sleep(2)

    orb.state("SPEAKING")
    orb.text("Je parle...")
    time.sleep(2)

    orb.state("IDLE")
    orb.text("Pret.")
    time.sleep(1)

    orb.close()
    print("OK")
