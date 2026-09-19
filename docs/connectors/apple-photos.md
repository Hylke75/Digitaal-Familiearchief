# Apple Photos / iCloud Photos connector

_Type: DEVICE_NATIVE. Established platform behaviour; re-verify at build._

**WHAT WORKS (design)** — a native iOS app using **PhotoKit** discovers the photo
library and uploads originals to the backend (see docs/mobile/apple-photos.md).

**REQUIRES PROVIDER APPROVAL** — Apple Developer Program + App Store review.

**NOT AVAILABLE** — full Apple Photos access from a browser. Do NOT fake it.

**FALLBACK** — local upload on web. Web shows: "Gebruik onze iPhone-app om Apple
Foto's automatisch veilig te stellen."
