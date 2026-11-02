#!/usr/bin/env python3
"""Build the userscript and the bookmarklet from spin.js.

Run after editing spin.js:  python3 build.py
"""
import html
import json
import re
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).parent
VERSION = "1.0.0"
PAGES = "https://ericdtroutman.github.io/smooth-360"

code = (ROOT / "spin.js").read_text()

header = f"""// ==UserScript==
// @name         Smooth 360 for Warhammer
// @namespace    {PAGES}/
// @version      {VERSION}
// @description  Adds a smooth, zoomable 360° viewer button to warhammer.com product pages.
// @match        https://www.warhammer.com/*
// @grant        none
// @run-at       document-idle
// @inject-into  auto
// @homepageURL  {PAGES}/
// @downloadURL  {PAGES}/smooth-360.user.js
// @updateURL    {PAGES}/smooth-360.user.js
// ==/UserScript==
"""
(ROOT / "smooth-360.user.js").write_text(header + "window.__gwspinUserscript=true;\n" + code)

bookmarklet = "javascript:" + urllib.parse.quote(code, safe="()=;,/?:@&+$!*'~.-_")
page = (ROOT / "index.html").read_text()
page = re.sub(r'(<a class="bm" id="bm" href=")[^"]*(")', lambda m: m.group(1) + html.escape(bookmarklet, quote=True) + m.group(2), page)
page = re.sub(r"(const BM=).*?(;\s*// end BM)", lambda m: m.group(1) + json.dumps(bookmarklet).replace("</", "<\\/") + m.group(2), page, flags=re.S)
(ROOT / "index.html").write_text(page)
print(f"userscript {len(header) + len(code)} bytes, bookmarklet {len(bookmarklet)} chars")
