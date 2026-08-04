#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import re
import subprocess
import time
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any

PACKAGE = "com.sjo1848.gasflow"
ACTIVITY = f"{PACKAGE}/.MainActivity"
OUTPUT_DIR = Path(os.environ.get("CAPTURE_OUTPUT_DIR", "artifacts/verified-media"))
SOURCE_COMMIT_SHA = os.environ.get("SOURCE_COMMIT_SHA", os.environ.get("GITHUB_SHA", "local"))
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
MINIMUM_BYTES = 10_000


def run(*args: str, check: bool = True, text: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(args, check=check, text=text, capture_output=True)


def adb(*args: str, check: bool = True, text: bool = True) -> subprocess.CompletedProcess[str]:
    return run("adb", *args, check=check, text=text)


def dump_ui() -> ET.Element:
    adb("shell", "uiautomator", "dump", "/sdcard/window.xml")
    xml = adb("exec-out", "cat", "/sdcard/window.xml").stdout
    return ET.fromstring(xml)


def node_label(node: ET.Element) -> str:
    return " ".join(
        value for value in (node.attrib.get("text", ""), node.attrib.get("content-desc", "")) if value
    ).strip()


def bounds_tuple(bounds: str) -> tuple[int, int, int, int]:
    match = re.fullmatch(r"\[(\d+),(\d+)]\[(\d+),(\d+)]", bounds)
    if not match:
        raise RuntimeError(f"Invalid Android bounds: {bounds!r}")
    return tuple(map(int, match.groups()))


def node_area(node: ET.Element) -> int:
    bounds = node.attrib.get("bounds")
    if not bounds:
        return 0
    try:
        left, top, right, bottom = bounds_tuple(bounds)
    except RuntimeError:
        return 0
    return max(0, right - left) * max(0, bottom - top)


def matching_nodes(root: ET.Element, target: str) -> list[ET.Element]:
    lowered = target.casefold()
    exact: list[ET.Element] = []
    partial: list[ET.Element] = []

    for node in root.iter("node"):
        label = node_label(node)
        if not label:
            continue
        if label.casefold() == lowered:
            exact.append(node)
        elif lowered in label.casefold():
            partial.append(node)

    candidates = exact if exact else partial
    return sorted(
        candidates,
        key=lambda node: (
            node.attrib.get("clickable") == "true",
            node.attrib.get("enabled") != "false",
            node_area(node),
        ),
        reverse=True,
    )


def wait_for_text(target: str, timeout: int = 60) -> ET.Element:
    deadline = time.time() + timeout
    last_labels: list[str] = []

    while time.time() < deadline:
        try:
            root = dump_ui()
            labels = [node_label(node) for node in root.iter("node") if node_label(node)]
            last_labels = labels[-20:]
            candidates = matching_nodes(root, target)
            if candidates:
                return candidates[0]
        except (subprocess.CalledProcessError, ET.ParseError):
            pass
        time.sleep(2)

    raise RuntimeError(f"Timed out waiting for {target!r}. Visible labels: {last_labels}")


def center_from_bounds(bounds: str) -> tuple[int, int]:
    left, top, right, bottom = bounds_tuple(bounds)
    return (left + right) // 2, (top + bottom) // 2


def tap_text(target: str, timeout: int = 60) -> None:
    node = wait_for_text(target, timeout)
    bounds = node.attrib.get("bounds")
    if not bounds:
        raise RuntimeError(f"UI node for {target!r} has no bounds")
    x, y = center_from_bounds(bounds)
    print(
        f"Tapping {target!r}: label={node_label(node)!r}, "
        f"clickable={node.attrib.get('clickable')}, bounds={bounds}"
    )
    adb("shell", "input", "tap", str(x), str(y))
    time.sleep(2)


def launch_app() -> None:
    adb("shell", "am", "force-stop", PACKAGE)
    adb("shell", "am", "start", "-n", ACTIVITY)


def validate_png(path: Path) -> dict[str, int]:
    data = path.read_bytes()
    if not data.startswith(PNG_SIGNATURE):
        raise RuntimeError(f"{path.name} is not a PNG")
    if len(data) < 24:
        raise RuntimeError(f"{path.name} is too short")
    width = int.from_bytes(data[16:20], "big")
    height = int.from_bytes(data[20:24], "big")
    if len(data) < MINIMUM_BYTES:
        raise RuntimeError(f"{path.name} is unexpectedly small ({len(data)} bytes)")
    return {"width": width, "height": height, "bytes": len(data)}


def screenshot(name: str, expected_text: str) -> dict[str, Any]:
    wait_for_text(expected_text)
    time.sleep(3)
    target = OUTPUT_DIR / f"{name}.png"
    result = subprocess.run(["adb", "exec-out", "screencap", "-p"], check=True, capture_output=True)
    target.write_bytes(result.stdout)
    metadata = validate_png(target)
    print(f"Captured {target.name}: {metadata['width']}x{metadata['height']}, {metadata['bytes']} bytes")
    return {"name": name, "filename": target.name, "expectedText": expected_text, **metadata}


def device_metadata() -> dict[str, str]:
    def prop(name: str) -> str:
        return adb("shell", "getprop", name).stdout.strip()

    return {
        "model": prop("ro.product.model"),
        "manufacturer": prop("ro.product.manufacturer"),
        "androidVersion": prop("ro.build.version.release"),
        "apiLevel": prop("ro.build.version.sdk"),
        "wmSize": adb("shell", "wm", "size").stdout.strip(),
        "wmDensity": adb("shell", "wm", "density").stdout.strip(),
    }


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    adb("wait-for-device")
    adb("shell", "cmd", "uimode", "night", "no", check=False)
    adb("shell", "settings", "put", "global", "window_animation_scale", "0")
    adb("shell", "settings", "put", "global", "transition_animation_scale", "0")
    adb("shell", "settings", "put", "global", "animator_duration_scale", "0")

    evidence: list[dict[str, Any]] = []

    launch_app()
    evidence.append(screenshot("01-login", "Iniciar Sesión"))

    tap_text("Iniciar Sesión")
    wait_for_text("Elegí modo de trabajo")
    tap_text("Panel Admin")
    evidence.append(screenshot("02-admin-orders", "Gestión de Pedidos"))

    tap_text("Stock")
    evidence.append(screenshot("03-admin-stock", "Stock y Balance"))

    adb("shell", "pm", "clear", PACKAGE)
    launch_app()
    wait_for_text("Iniciar Sesión")
    tap_text("Repartidor Demo")
    tap_text("Iniciar Sesión")
    wait_for_text("Elegí modo de trabajo")
    tap_text("Panel Repartidor")
    evidence.append(screenshot("04-driver-orders", "Mis Entregas"))

    tap_text("Registrar", timeout=30)
    evidence.append(screenshot("05-delivery-detail", "Registrar entrega"))

    manifest = {
        "repository": "sjo1848/gasflow",
        "commitSha": SOURCE_COMMIT_SHA,
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "applicationId": PACKAGE,
        "apiBaseUrl": "http://10.0.2.2:8080",
        "buildCommand": "npx expo prebuild --platform android --clean && ./gradlew app:assembleRelease",
        "device": device_metadata(),
        "seed": "development Docker Compose database and demo users declared by the repository",
        "evidence": evidence,
        "reviewRequired": [
            "Confirm that all addresses and orders shown are development seed data.",
            "Confirm that no emulator or host identifiers need redaction.",
            "Select portfolio covers only after responsive and accessibility review.",
        ],
    }
    (OUTPUT_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    print(f"Android verified media capture passed: {len(evidence)} screenshots.")


if __name__ == "__main__":
    main()
