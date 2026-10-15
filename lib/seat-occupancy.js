/**
 * Pure helpers: Ingresso seat maps → room occupancy.
 * Loaded as a classic script in the extension (globalThis.IcmSeatOccupancy)
 * and required from Node unit tests.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.IcmSeatOccupancy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Seats that can be sold. Anything else (e.g. PhysicalDistance, which blocks
  // seats next to wheelchair spaces) is left out of the room's capacity.
  const FREE_STATUSES = ['Available'];
  const TAKEN_STATUSES = ['Occupied'];

  function extractSessionId(href) {
    const m = String(href || '').match(/[?&]sessionId=(\d+)/);
    return m ? m[1] : null;
  }

  function countSeats(seatMap) {
    let free = 0, taken = 0;
    for (const line of seatMap?.lines || []) {
      for (const seat of line?.seats || []) {
        if (FREE_STATUSES.includes(seat.status)) free += 1;
        else if (TAKEN_STATUSES.includes(seat.status)) taken += 1;
      }
    }
    return { free, taken };
  }

  // Combines every section of a session (a room can be split into sections).
  // Returns null when there is nothing to measure.
  function summarizeSeatMaps(seatMaps) {
    let free = 0, taken = 0;
    for (const map of seatMaps || []) {
      const c = countSeats(map);
      free += c.free;
      taken += c.taken;
    }
    const capacity = free + taken;
    if (capacity === 0) return null;
    return { taken, capacity, percent: Math.round((taken / capacity) * 100) };
  }

  function occupancyLevel(percent) {
    if (percent >= 80) return 'high';
    if (percent >= 50) return 'medium';
    return 'low';
  }

  return {
    extractSessionId,
    countSeats,
    summarizeSeatMaps,
    occupancyLevel
  };
});
