/**
 * This file includes polyfills needed by Angular and is loaded before the app.
 */

/**
 * Buffer polyfill for Chrome 146+ compatibility
 * Required by class-transformer and other Node.js dependencies in browser
 */
import { Buffer } from 'buffer';
const globalScope = globalThis as any;
if (!globalScope.Buffer) {
  globalScope.Buffer = Buffer;
}

/***************************************************************************************************
 * Zone JS is required by default for Angular itself.
 */
import 'zone.js';
