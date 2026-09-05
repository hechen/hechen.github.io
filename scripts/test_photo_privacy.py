import struct
import unittest
import zlib
from photo_privacy import sanitize


def segment(marker, body):
    return bytes([255, marker]) + struct.pack('>H', len(body) + 2) + body


def chunk(kind, body):
    return struct.pack('>I', len(body)) + kind + body + struct.pack('>I', zlib.crc32(kind + body))


class PrivacyTests(unittest.TestCase):
    def test_mpo_secondary_image_and_metadata_are_removed(self):
        scan = segment(0xDA, b'\x01\x01\x00\x00\x3f\x00') + b'pixels\xff\x00escaped\xff\xd0restart'
        clean = b'\xff\xd8' + scan + b'\xff\xd9'
        original = b'\xff\xd8' + segment(0xE1, b'Exif\0\0private') + segment(0xE2, b'MPF\0offsets') + scan + b'\xff\xd9' + b'\xff\xd8Exif\0\0private-preview\xff\xd9'
        self.assertEqual(sanitize(original), clean)
        self.assertEqual(sanitize(clean), clean)

    def test_progressive_scan_pixels_and_color_profile_survive(self):
        icc = segment(0xE2, b'ICC_PROFILE\0profile')
        first = segment(0xDA, b'header') + b'first-scan'
        table = segment(0xC4, b'huffman')
        second = segment(0xDA, b'header') + b'second-scan'
        expected = b'\xff\xd8' + icc + first + table + second + b'\xff\xd9'
        original = b'\xff\xd8' + icc + first + segment(0xFE, b'private-comment') + table + second + b'\xff\xd9'
        self.assertEqual(sanitize(original), expected)

    def test_jfif_thumbnail_is_removed(self):
        header = b'JFIF\0' + b'\x01\x02\x00\x00\x01\x00\x01'
        original = b'\xff\xd8' + segment(0xE0, header + b'\x01\x01RGB') + b'\xff\xd9'
        expected = b'\xff\xd8' + segment(0xE0, header + b'\0\0') + b'\xff\xd9'
        self.assertEqual(sanitize(original), expected)

    def test_png_metadata_and_trailer_removed_pixel_chunks_unchanged(self):
        header = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', 1, 1, 8, 2, 0, 0, 0))
        pixels = chunk(b'IDAT', zlib.compress(b'\x00\x00\x00\x00'))
        end = chunk(b'IEND', b'')
        original = header + chunk(b'eXIf', b'GPS') + chunk(b'tEXt', b'private') + pixels + end + b'private-trailer'
        self.assertEqual(sanitize(original), header + pixels + end)

    def test_unsupported_and_truncated_files_fail(self):
        for data in [b'RIFFwebp', b'\xff\xd8', b'\xff\xd8\xff\xe1\x00\xff']:
            with self.assertRaises((ValueError, IndexError)):
                sanitize(data)


if __name__ == '__main__':
    unittest.main()
