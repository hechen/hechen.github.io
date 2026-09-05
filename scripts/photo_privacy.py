#!/usr/bin/env python3
"""Remove photo metadata and embedded secondary images without re-encoding pixels.

--check fails if any input would change. Always inspect visible content separately.
Only JPEG and PNG are supported; other image formats fail closed.
"""
import argparse
from pathlib import Path
import struct


def clean_jpeg(data):
    if not data.startswith(b'\xff\xd8'):
        raise ValueError('Invalid JPEG header')
    out = bytearray(data[:2])
    pos = 2
    while pos < len(data):
        start = pos
        if data[pos] != 255:
            raise ValueError('Invalid JPEG marker')
        while pos < len(data) and data[pos] == 255:
            pos += 1
        marker = data[pos]
        pos += 1
        if marker == 0xD9:
            out.extend(b'\xff\xd9')
            return bytes(out)  # Discard all trailers, including MPO previews.
        if marker in (0xD8, 0x00) or 0xD0 <= marker <= 0xD7:
            raise ValueError('Unexpected JPEG marker')
        size = int.from_bytes(data[pos:pos + 2], 'big')
        end = pos + size
        if size < 2 or end > len(data):
            raise ValueError('Invalid JPEG segment')
        payload = data[pos + 2:end]
        # Retain decoding/color information only. Drop EXIF, XMP, IPTC, MPF,
        # comments, unknown application segments and embedded thumbnails.
        keep = not (0xE0 <= marker <= 0xEF or marker == 0xFE)
        if marker == 0xE0 and payload.startswith(b'JFIF\0'):
            # JFIF's optional RGB thumbnail must not survive a visible redaction.
            if len(payload) < 14:
                raise ValueError('Invalid JFIF segment')
            header = payload[:12] + b'\0\0'
            out.extend(b'\xff\xe0' + struct.pack('>H', len(header) + 2) + header)
        elif marker == 0xE2 and payload.startswith(b'ICC_PROFILE\0'):
            out.extend(data[start:end])
        elif marker == 0xEE and payload.startswith(b'Adobe'):
            out.extend(data[start:end])
        elif keep:
            out.extend(data[start:end])
        pos = end
        if marker == 0xDA:
            scan_start = pos
            while True:
                boundary = data.find(b'\xff', pos)
                if boundary < 0 or boundary + 1 >= len(data):
                    raise ValueError('Truncated JPEG scan')
                next_pos = boundary + 1
                while next_pos < len(data) and data[next_pos] == 255:
                    next_pos += 1
                code = data[next_pos]
                if code == 0 or 0xD0 <= code <= 0xD7:
                    pos = next_pos + 1
                    continue
                out.extend(data[scan_start:boundary])
                pos = boundary
                break
    raise ValueError('Missing JPEG end marker')


def clean_png(data):
    out = bytearray(data[:8])
    pos = 8
    # Critical pixel chunks plus standard color/transparency information.
    allowed = {b'IHDR', b'PLTE', b'IDAT', b'IEND', b'tRNS', b'sRGB', b'gAMA', b'cHRM', b'iCCP'}
    while pos + 12 <= len(data):
        size = int.from_bytes(data[pos:pos + 4], 'big')
        kind = data[pos + 4:pos + 8]
        end = pos + 12 + size
        if end > len(data):
            raise ValueError('Truncated PNG')
        if kind in allowed:
            out.extend(data[pos:end])
        elif not kind[0] & 32 or kind == b'acTL':
            raise ValueError('Unsupported PNG critical chunk or animation')
        if kind == b'IEND':
            return bytes(out)
        pos = end
    raise ValueError('Missing PNG end chunk')


def sanitize(data):
    if data.startswith(b'\xff\xd8'):
        return clean_jpeg(data)
    if data.startswith(b'\x89PNG\r\n\x1a\n'):
        return clean_png(data)
    raise ValueError('Unsupported format; export a reviewed JPEG or PNG first')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    parser.add_argument('paths', nargs='+', type=Path)
    args = parser.parse_args()
    files = []
    for path in args.paths:
        files.extend(sorted(p for p in path.rglob('*') if p.is_file())) if path.is_dir() else files.append(path)
    failed = 0
    for path in files:
        try:
            original = path.read_bytes()
            cleaned = sanitize(original)
            if cleaned != original:
                if args.check:
                    failed += 1
                    print(f'FAIL metadata/embedded data: {path}')
                else:
                    path.write_bytes(cleaned)
                    print(f'Cleaned: {path}')
        except (ValueError, IndexError, struct.error) as exc:
            failed += 1
            print(f'FAIL {path}: {exc}')
    print(f'{len(files)} photos checked; {failed} failures')
    raise SystemExit(1 if failed else 0)


if __name__ == '__main__':
    main()
