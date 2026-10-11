/** Signed-out visitors to "/" get the static Stitch landing page unchanged.
 *  Signed-in users (portal_session cookie present) still get the dashboard. */
const nextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          missing: [{ type: "cookie", key: "portal_session" }],
          destination: "/landing.html",
        },
      ],
    };
  },
};

export default nextConfig;
