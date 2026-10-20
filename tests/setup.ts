import '@testing-library/jest-dom/vitest';

/**
 * jsdom implements <dialog> but not showModal/close, and the app uses
 * the native element deliberately. Standing them in here keeps the
 * component honest rather than replacing the dialog with a div for the
 * benefit of the tests.
 */
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
}
