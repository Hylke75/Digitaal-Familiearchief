/**
 * Portability client — the contract for PORTABILITY_API connectors (e.g. TikTok):
 * request an official export, poll until it is ready, download the archive
 * package, then parse + archive it. Different from the crawl-based
 * {@link LiveSourceClient}; the worker drives the async request→poll→download
 * state machine (CONNECTORS_BUILD.md §16 Type B, §18).
 */
export interface PortabilityStatus {
  /** Raw provider status. */
  status: string;
  /** The export is ready to download now. */
  ready: boolean;
  /** The request expired or was cancelled → request a fresh export. */
  failed: boolean;
}

export interface PortabilityClient {
  readonly connectorKey: string;
  /** Start an export; returns an opaque request id to track it. */
  requestExport(accessToken: string): Promise<string>;
  /** Poll the export status. */
  checkStatus(accessToken: string, requestId: string): Promise<PortabilityStatus>;
  /** Download the ready export as a ZIP (bytes). */
  downloadExport(accessToken: string, requestId: string): Promise<Uint8Array>;
}
