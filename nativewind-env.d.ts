/// <reference types="nativewind/types" />

// TypeScript 6 requires a declaration for side-effect imports; the global
// stylesheet is consumed by Metro (via nativewind/metro), not by tsc.
declare module '*.css';
