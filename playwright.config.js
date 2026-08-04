export default {
  testDir: "./tests",
  timeout: 30000,
  use: {
    channel: "chrome",
    baseURL: "http://127.0.0.1:8791",
    screenshot: "only-on-failure",
  },
};
