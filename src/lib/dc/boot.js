// Browser: replace the build-time HTML with the live component (same markup, now interactive).
import { parseBoard, mount } from './runtime.js';
import emblemTpl from '../../boards/emblem.html?raw';
import emblemCls from '../../boards/emblem.js';

export function boot(tpl, makeClass, selector = '[data-board]') {
  const wrap = document.querySelector(selector); if (!wrap) return null;
  const comps = { Emblem: parseBoard(DOMParser, emblemTpl, emblemCls) };
  const board = parseBoard(DOMParser, tpl, makeClass);
  wrap.replaceChildren();
  const inst = mount(board, {}, wrap, comps);
  window.__board = inst;
  return inst;
}
