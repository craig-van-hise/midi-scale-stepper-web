export interface NoteRect {
  note: number;
  x: number;
  w: number;
  isBlack: boolean;
}

// Pre-calculate exact layout for all 88 keys based on standard piano topography
export const NoteRects: Record<number, NoteRect> = {};
export const whiteKeys: number[] = [];
export const blackKeys: number[] = [];

let currentX = 0;
for (let n = 21; n <= 108; n++) {
  const relativeToC = n % 12;
  const isBlack = [false, true, false, true, false, false, true, false, true, false, true, false][relativeToC];
  
  if (isBlack) {
    NoteRects[n] = { note: n, x: currentX - 5.5, w: 11, isBlack: true };
    blackKeys.push(n);
  } else {
    NoteRects[n] = { note: n, x: currentX, w: 19, isBlack: false };
    whiteKeys.push(n);
    currentX += 19;
  }
}

export const getLeftBound = (note: number): number => {
  const el = document.getElementById(`pksplit-${note}`);
  const baseLeft = el ? el.offsetLeft : NoteRects[note].x;

  if (!NoteRects[note].isBlack) {
    const prevNote = note - 1;
    if (NoteRects[prevNote] && NoteRects[prevNote].isBlack) {
      const prevEl = document.getElementById(`pksplit-${prevNote}`);
      if (prevEl) {
        return prevEl.offsetLeft + prevEl.offsetWidth;
      }
      return NoteRects[prevNote].x + NoteRects[prevNote].w;
    }
  }
  return baseLeft;
};

export const getRightBound = (note: number): number => {
  const el = document.getElementById(`pksplit-${note}`);
  const baseRight = el ? el.offsetLeft + el.offsetWidth : NoteRects[note].x + NoteRects[note].w;

  if (!NoteRects[note].isBlack) {
    const nextNote = note + 1;
    if (NoteRects[nextNote] && NoteRects[nextNote].isBlack) {
      const nextEl = document.getElementById(`pksplit-${nextNote}`);
      if (nextEl) {
        return nextEl.offsetLeft;
      }
      return NoteRects[nextNote].x;
    }
  }
  return baseRight;
};

export const getStartNoteFromX = (x: number): number => {
  let best = 21;
  let minDiff = Infinity;
  for (let n = 21; n <= 108; n++) {
    const d = Math.abs(x - getLeftBound(n));
    if (d < minDiff) { 
      minDiff = d; 
      best = n; 
    }
  }
  return best;
};

export const getEndNoteFromX = (x: number): number => {
  let best = 21;
  let minDiff = Infinity;
  for (let n = 21; n <= 108; n++) {
    const d = Math.abs(x - getRightBound(n));
    if (d < minDiff) { 
      minDiff = d; 
      best = n; 
    }
  }
  return best;
};
