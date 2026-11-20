"""Encrypt deck slides for the password-protected site.
Usage: python3 tools/encrypt_slides.py <password> <folder-of-plain-jpgs>
Writes slides/N.bin and prints the SALT + VERIFY values to paste into index.html.
Never commit the plain JPGs."""
import sys, os, base64, glob, re
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

ITER = 250000
pw, src = sys.argv[1], sys.argv[2]
salt = os.urandom(16)
key = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=ITER).derive(pw.encode())
aes = AESGCM(key)
out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'slides')
os.makedirs(out, exist_ok=True)
for old in glob.glob(os.path.join(out, '*')): os.remove(old)
files = sorted(glob.glob(os.path.join(src, '*.jpg')), key=lambda p: int(re.sub(r'\D', '', os.path.splitext(os.path.basename(p))[0]) or 0))
for f in files:
    n = int(re.sub(r'\D', '', os.path.splitext(os.path.basename(f))[0]))
    iv = os.urandom(12)
    open(os.path.join(out, f'{n}.bin'), 'wb').write(iv + aes.encrypt(iv, open(f, 'rb').read(), None))
# video slides: 19.mp4 etc. -> 19.vbin (plays in place of the still)
vids = []
for f in sorted(glob.glob(os.path.join(src, '*.mp4'))):
    n = int(re.sub(r'\D', '', os.path.splitext(os.path.basename(f))[0]))
    iv = os.urandom(12)
    open(os.path.join(out, f'{n}.vbin'), 'wb').write(iv + aes.encrypt(iv, open(f, 'rb').read(), None))
    vids.append(n)
iv = os.urandom(12)
verify = base64.b64encode(iv + aes.encrypt(iv, b'FALLING SUNS', None)).decode()
print(f"VIDEO_SLIDES={vids}\nSLIDES={len(files)}\nSALT={base64.b64encode(salt).decode()}\nVERIFY={verify}\nITER={ITER}")
