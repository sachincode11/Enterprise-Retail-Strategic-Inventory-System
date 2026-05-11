// src/utils/fakeApi.js
// Reusable helper that simulates async API with loading delay.
// Returns a consistent { data, status, message } contract.

export function fakeApi(payload, delay = 350) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: payload, status: 200, message: 'Success' });
    }, delay);
  });
}

export function fakeApiError(message = 'Something went wrong', delay = 350) {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject({ data: null, status: 500, message });
    }, delay);
  });
}
